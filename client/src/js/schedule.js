import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    loadScheduleData();
});

async function loadScheduleData() {
    try {
        const res = await fetch(`${API_BASE_URL}/schedule/tasks`, {
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const data = await res.json();

        if (res.ok) {
            renderTimeline(data.tasks);
            renderStatusChart(data.tasks);
            renderProjectChart(data.tasks);
        } else {
            toast.error("Lỗi tải dữ liệu lịch trình");
        }
    } catch (err) {
        console.error(err);
        toast.error("Lỗi kết nối server");
    }
}

// 1. Biểu đồ Timeline (Gantt Chart style dùng Bar Chart ngang)
function renderTimeline(tasks) {
    const ctx = document.getElementById('timelineChart').getContext('2d');

    // Xử lý dữ liệu: Chỉ lấy các task có deadline
    const timelineData = tasks
        .filter(t => t.deadline) 
        .map(t => {
            // [CẬP NHẬT] Ưu tiên dùng startTime, nếu không có thì dùng createdAt
            const startRaw = t.startTime ? t.startTime : t.createdAt;
            
            const start = new Date(startRaw).getTime();
            let end = new Date(t.deadline).getTime();
            
            // Validation: Nếu ngày bắt đầu > hạn chót (do chỉnh sửa sai), tự đẩy hạn chót lên 1 ngày để biểu đồ không lỗi
            if (start > end) end = start + 86400000; 

            return {
                x: [start, end], // Dải thời gian [Bắt đầu, Kết thúc]
                y: t.title,      // Tên Task (Trục Y)
                project: t.project ? t.project.title : 'Không xác định' // Để hiển thị tooltip
            };
        });

    // Nếu không có dữ liệu thì không vẽ gì cả (tránh lỗi chart.js)
    if (timelineData.length === 0) {
        return; 
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            // Label trục Y là tên Task
            labels: timelineData.map(d => d.y), 
            datasets: [{
                label: 'Thời gian thực hiện',
                data: timelineData,
                backgroundColor: 'rgba(0, 121, 191, 0.7)', // Màu xanh thương hiệu
                borderColor: '#0079bf',
                borderWidth: 1,
                borderSkipped: false,
                barPercentage: 0.6,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // Biểu đồ ngang
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Ẩn chú thích thừa vì đã có tiêu đề trục
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return 'Dự án: ' + context.raw.project;
                        },
                        label: function(context) {
                            // Format ngày trong tooltip cho dễ đọc
                            const start = new Date(context.raw.x[0]).toLocaleDateString('vi-VN');
                            const end = new Date(context.raw.x[1]).toLocaleDateString('vi-VN');
                            return `Thời gian: ${start} - ${end}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time', // Trục X là thời gian
                    time: { unit: 'day' },
                    min: Date.now() - (7 * 86400000), // Mặc định hiển thị từ 7 ngày trước để nhìn thoáng hơn
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false, // Hiện tất cả tên task không được bỏ sót
                        font: { size: 12, weight: '500' },
                        color: '#172b4d'
                    },
                    grid: {
                        display: false // Ẩn lưới trục Y cho đỡ rối
                    }
                }
            }
        }
    });
}

// 2. Biểu đồ Tròn (Doughnut Chart) - Trạng thái Task
function renderStatusChart(tasks) {
    const ctx = document.getElementById('statusChart').getContext('2d');

    // Group by status (dựa vào title của cột)
    const statusCounts = {};
    tasks.forEach(t => {
        if (t.column) {
            const status = t.column.title;
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    // Nếu không có dữ liệu
    if (labels.length === 0) return;

    // Bảng màu đẹp mắt
    const colors = ['#2e8b57', '#00c2e0', '#ffab00', '#eb5a46', '#0079bf', '#6b778c'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right',
                    labels: { boxWidth: 15, padding: 15 }
                }
            }
        }
    });
}

// 3. Biểu đồ Cột (Bar Chart) - Số việc theo Dự án
function renderProjectChart(tasks) {
    const ctx = document.getElementById('projectChart').getContext('2d');

    // Group by Project
    const projectCounts = {};
    tasks.forEach(t => {
        if (t.project) {
            const projName = t.project.title;
            projectCounts[projName] = (projectCounts[projName] || 0) + 1;
        }
    });

    const labels = Object.keys(projectCounts);
    const data = Object.values(projectCounts);

    if (labels.length === 0) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng công việc',
                data: data,
                backgroundColor: '#ff7f32', // Màu cam
                borderRadius: 4,
                barThickness: 40 // Độ dày cột cố định
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1 },
                    grid: { borderDash: [2, 4] }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}