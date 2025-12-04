import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { io } from "socket.io-client";

// Biến toàn cục
let allTasksData = []; 
let chartInstances = {
    timeline: null,
    status: null,
    project: null
};
let socket = null;
let currentFilterType = 'month'; // Mặc định hiển thị theo tháng

document.addEventListener('DOMContentLoaded', () => {
    loadScheduleData();
    setupFilters();
    initRealtimeUpdate();
});

// --- 0. SOCKET REAL-TIME ---
async function initRealtimeUpdate() {
    socket = io("http://localhost:5000");
    const user = JSON.parse(localStorage.getItem('maneasily_user'));
    
    if (!user) return;

    try {
        // 1. Lấy danh sách dự án của user để join room
        const res = await fetch(`${API_BASE_URL}/projects?userId=${user._id}`);
        const data = await res.json();
        
        if (data.projects) {
            // 2. Join vào từng phòng dự án để lắng nghe sự kiện
            data.projects.forEach(proj => {
                socket.emit('joinBoard', proj._id);
            });
            console.log(`📡 Đã kết nối theo dõi ${data.projects.length} dự án.`);
        }
    } catch (err) {
        console.error("Lỗi kết nối socket:", err);
    }

    // 3. Lắng nghe sự kiện cập nhật từ server
    socket.on('boardUpdated', (data) => {
        console.log("⚡ Có thay đổi từ server, đang cập nhật lịch trình...");
        // Reload lại dữ liệu (Debounce 500ms để tránh spam request)
        setTimeout(() => {
            loadScheduleData();
        }, 500);
    });
}

// --- 1. TẢI DỮ LIỆU TỪ SERVER ---
async function loadScheduleData() {
    try {
        const res = await fetch(`${API_BASE_URL}/schedule/tasks`, {
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const data = await res.json();

        if (res.ok) {
            allTasksData = data.tasks || [];
            
            // Render lại giao diện theo bộ lọc đang chọn
            filterAndRender(currentFilterType);
        } else {
            // toast.error("Lỗi tải dữ liệu lịch trình"); 
        }
    } catch (err) {
        console.error(err);
    }
}

// --- 2. XỬ LÝ BỘ LỌC (FILTER) ---
function setupFilters() {
    const buttons = document.querySelectorAll('.btn-date-filter');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI Active Class
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Xác định loại lọc
            currentFilterType = e.target.textContent.includes('Toàn bộ') ? 'all' : 'month';
            filterAndRender(currentFilterType);
        });
    });
}

// --- 3. HÀM LỌC VÀ RENDER CHÍNH ---
function filterAndRender(type) {
    let filteredTasks = [];

    if (type === 'all') {
        filteredTasks = allTasksData;
    } else {
        // Lọc theo tháng hiện tại
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        filteredTasks = allTasksData.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }

    // Cập nhật số liệu thống kê (Stats) dựa trên dữ liệu ĐÃ LỌC
    updateStats(filteredTasks);

    // Vẽ lại các biểu đồ
    renderTimeline(filteredTasks);
    renderStatusChart(filteredTasks);
    renderProjectChart(filteredTasks);
}

// --- 4. CẬP NHẬT THẺ THỐNG KÊ (STATS) ---
function updateStats(tasks) {
    const now = new Date();

    // Helper: Check task đã xong chưa (dựa vào tên cột)
    const isTaskDone = (t) => {
        if (!t.column || !t.column.title) return false; 
        const title = t.column.title.toLowerCase();
        return title.includes('done') || title.includes('hoàn thành') || title.includes('xong');
    };

    // 1. Tổng số công việc
    const total = tasks.length;

    // 2. Quá hạn: (Có deadline + Deadline < Hiện tại + Chưa xong)
    const overdue = tasks.filter(t => {
        if (!t.deadline) return false;
        if (isTaskDone(t)) return false; 
        return new Date(t.deadline) < now;
    }).length;
    
    // 3. Đang thực hiện: (Chưa xong + (Chưa quá hạn HOẶC không có deadline))
    const active = tasks.filter(t => {
        if (isTaskDone(t)) return false; 
        if (t.deadline && new Date(t.deadline) < now) return false; 
        return true;
    }).length; 

    // Hiệu ứng nhảy số
    animateValue("stat-total", parseInt(document.getElementById('stat-total').innerText || 0), total, 300);
    animateValue("stat-active", parseInt(document.getElementById('stat-active').innerText || 0), active, 300);
    animateValue("stat-overdue", parseInt(document.getElementById('stat-overdue').innerText || 0), overdue, 300);
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    if (!obj) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

// --- 5. BIỂU ĐỒ TIMELINE (MÀU SẮC ĐỘNG) ---
function renderTimeline(tasks) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    if (chartInstances.timeline) chartInstances.timeline.destroy();

    const now = new Date();

    // Helper check hoàn thành
    const isTaskDone = (t) => {
        if (!t.column || !t.column.title) return false;
        const title = t.column.title.toLowerCase();
        return title.includes('done') || title.includes('hoàn thành') || title.includes('xong');
    };

    // Chỉ vẽ các task có deadline
    const validTasks = tasks.filter(t => t.deadline);

    const timelineData = validTasks.map(t => {
        const startRaw = t.startTime ? t.startTime : t.createdAt;
        const start = new Date(startRaw).getTime();
        let end = new Date(t.deadline).getTime();
        
        // Đảm bảo thanh có độ dài tối thiểu để hiển thị
        if (start > end) end = start + 86400000; 

        return { x: [start, end], y: t.title };
    });

    // Tạo mảng màu sắc tương ứng cho từng task
    const timelineColors = validTasks.map(t => {
        if (isTaskDone(t)) {
            return 'rgba(34, 197, 94, 0.85)'; // Xanh lá: Đã xong
        }
        if (new Date(t.deadline) < now) {
            return 'rgba(229, 62, 62, 0.85)'; // Đỏ: Quá hạn
        }
        return 'rgba(0, 121, 191, 0.85)'; // Xanh dương: Đang làm
    });

    if (timelineData.length === 0) {
        if(chartInstances.timeline) chartInstances.timeline.clear();
        return;
    }

    chartInstances.timeline = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: timelineData.map(d => d.y), 
            datasets: [{
                label: 'Tiến độ',
                data: timelineData,
                backgroundColor: timelineColors, // Áp dụng mảng màu
                borderRadius: 4,
                barPercentage: 0.5
            }]
        },
        options: {
            indexAxis: 'y', 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        // Hiển thị trạng thái trong tooltip
                        afterLabel: function(context) {
                            const taskIndex = context.dataIndex;
                            const task = validTasks[taskIndex];
                            if (isTaskDone(task)) return 'Trạng thái: Đã hoàn thành';
                            if (new Date(task.deadline) < now) return 'Trạng thái: Quá hạn';
                            return 'Trạng thái: Đang thực hiện';
                        },
                        label: function(context) {
                            const start = new Date(context.raw.x[0]).toLocaleDateString('vi-VN');
                            const end = new Date(context.raw.x[1]).toLocaleDateString('vi-VN');
                            return `${start} - ${end}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day' },
                    grid: { color: '#f4f5f7' },
                    min: Date.now() - (7 * 86400000) 
                },
                y: { 
                    grid: { display: false },
                    ticks: { font: { family: 'Inter' } }
                }
            }
        }
    });
}

// --- 6. BIỂU ĐỒ TRẠNG THÁI (STATUS) ---
function renderStatusChart(tasks) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (chartInstances.status) chartInstances.status.destroy();

    const statusCounts = {};
    tasks.forEach(t => {
        const status = (t.column && t.column.title) ? t.column.title : 'Chưa phân loại';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    if (labels.length === 0) {
        if(chartInstances.status) chartInstances.status.clear();
        return;
    }

    chartInstances.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#0c66e4', '#22c55e', '#f59f00', '#e53e3e', '#9053c6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            },
            cutout: '70%'
        }
    });
}

// --- 7. BIỂU ĐỒ DỰ ÁN (PROJECT) ---
function renderProjectChart(tasks) {
    const ctx = document.getElementById('projectChart').getContext('2d');
    if (chartInstances.project) chartInstances.project.destroy();

    const projectCounts = {};
    tasks.forEach(t => {
        const projName = (t.project && t.project.title) ? t.project.title : 'Khác';
        projectCounts[projName] = (projectCounts[projName] || 0) + 1;
    });

    const labels = Object.keys(projectCounts);
    const data = Object.values(projectCounts);

    if (labels.length === 0) {
        if(chartInstances.project) chartInstances.project.clear();
        return;
    }

    chartInstances.project = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng',
                data: data,
                backgroundColor: '#ff7f32', 
                borderRadius: 6,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f4f5f7' } },
                x: { grid: { display: false } }
            }
        }
    });
}