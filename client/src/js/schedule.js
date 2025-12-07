import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { io } from "socket.io-client";

// --- CẤU HÌNH GOOGLE CALENDAR API ---
// [QUAN TRỌNG] Hãy thay mã của bạn vào đây
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; 
const API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

// Biến toàn cục
let allTasksData = []; 
let chartInstances = {
    timeline: null,
    status: null,
    project: null
};
let socket = null;
let currentFilterType = 'month'; // Mặc định hiển thị theo tháng

// Biến cho Google API
let tokenClient;
let gapiInited = false;
let gisInited = false;

document.addEventListener('DOMContentLoaded', () => {
    loadScheduleData();
    setupFilters();
    initRealtimeUpdate();
    initGoogleApi(); // Khởi tạo Google API
    setupExportMenu(); // Cài đặt menu xuất lịch
});

// --- 0. KHỞI TẠO GOOGLE API ---
function initGoogleApi() {
    // Load gapi client library
    if(typeof gapi !== 'undefined') {
        gapi.load('client', async () => {
            await gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
        });
    }
    
    // Load Google Identity Services library
    if(typeof google !== 'undefined') {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Callback sẽ được set khi người dùng bấm nút
        });
        gisInited = true;
    }
}

// --- 1. SOCKET REAL-TIME ---
async function initRealtimeUpdate() {
    socket = io("http://localhost:5000");
    const user = JSON.parse(localStorage.getItem('maneasily_user'));
    
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE_URL}/projects?userId=${user._id}`);
        const data = await res.json();
        
        if (data.projects) {
            data.projects.forEach(proj => {
                socket.emit('joinBoard', proj._id);
            });
            console.log(`📡 Đã kết nối theo dõi ${data.projects.length} dự án.`);
        }
    } catch (err) {
        console.error("Lỗi kết nối socket:", err);
    }

    socket.on('boardUpdated', (data) => {
        console.log("⚡ Có thay đổi từ server, đang cập nhật lịch trình...");
        setTimeout(() => {
            loadScheduleData();
        }, 500);
    });
}

// --- 2. TẢI DỮ LIỆU TỪ SERVER ---
async function loadScheduleData() {
    try {
        const res = await fetch(`${API_BASE_URL}/schedule/tasks`, {
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const data = await res.json();

        if (res.ok) {
            allTasksData = data.tasks || [];
            filterAndRender(currentFilterType);
        }
    } catch (err) {
        console.error(err);
    }
}

// --- 3. XỬ LÝ BỘ LỌC (FILTER GIAO DIỆN) ---
function setupFilters() {
    const buttons = document.querySelectorAll('.btn-date-filter');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            buttons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilterType = e.target.textContent.includes('Toàn bộ') ? 'all' : 'month';
            filterAndRender(currentFilterType);
        });
    });
}

function filterAndRender(type) {
    let filteredTasks = [];

    if (type === 'all') {
        filteredTasks = allTasksData;
    } else {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        filteredTasks = allTasksData.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }

    updateStats(filteredTasks);
    renderTimeline(filteredTasks);
    renderStatusChart(filteredTasks);
    renderProjectChart(filteredTasks);
}

// --- 4. XỬ LÝ MENU XUẤT LỊCH (EXPORT) ---
function setupExportMenu() {
    const exportBtn = document.getElementById('btn-export-calendar');
    const exportMenu = document.getElementById('export-menu');

    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Toggle menu
            exportMenu.style.display = exportMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Đóng khi click ra ngoài
        window.addEventListener('click', (e) => {
            if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
                exportMenu.style.display = 'none';
            }
        });
    }
}

// --- 5. LOGIC XUẤT GOOGLE CALENDAR (CORE) ---

// Hàm này được gọi từ HTML (onclick)
window.exportSchedule = async (range) => {
    // Đóng menu
    const exportMenu = document.getElementById('export-menu');
    if (exportMenu) exportMenu.style.display = 'none';

    // Kiểm tra cấu hình
    if (CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        return toast.error("Chưa cấu hình Google Client ID trong code!");
    }

    // Thiết lập callback khi đăng nhập thành công
    tokenClient.callback = async (resp) => {
        if (resp.error) {
            throw (resp);
        }
        await pushToGoogleCalendar(range);
    };

    // Kiểm tra quyền truy cập (Token)
    if (gapi.client.getToken() === null) {
        // Chưa có quyền -> Hiện Popup xin quyền
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Đã có quyền -> Chạy luôn
        await pushToGoogleCalendar(range);
    }
};

async function pushToGoogleCalendar(range) {
    toast.info("Đang đồng bộ sang Google Calendar...");
    
    try {
        // A. Lấy dữ liệu mới nhất từ Server để đảm bảo chính xác
        const res = await fetch(`${API_BASE_URL}/schedule/tasks`, { 
            headers: { 'Authorization': localStorage.getItem('maneasily_token') } 
        });
        const data = await res.json();
        let tasks = data.tasks || [];

        // B. Lọc Task theo phạm vi người dùng chọn (range)
        const now = new Date();
        tasks = tasks.filter(t => {
            if (!t.startTime || !t.deadline) return false;
            const taskDate = new Date(t.startTime);
            
            if (range === 'week') {
                const oneDay = 24 * 60 * 60 * 1000;
                const diffDays = Math.round(Math.abs((now - taskDate) / oneDay));
                // Logic đơn giản: trong vòng 7 ngày tới hoặc lui
                return diffDays <= 7; 
            }
            if (range === 'month') {
                return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
            }
            return true; // 'all'
        });

        if (tasks.length === 0) return toast.error("Không có công việc nào trong khoảng thời gian này!");

        // C. Gửi Batch Request (Nhiều việc cùng lúc)
        let successCount = 0;
        const batch = gapi.client.newBatch();
        
        tasks.forEach(t => {
            // Tạo object sự kiện chuẩn Google Calendar
            const event = {
                'summary': `[Maneasily] ${t.title}`,
                'description': t.dec || '',
                'start': {
                    'dateTime': new Date(t.startTime).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': new Date(t.deadline).toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                // Thêm nhắc nhở mặc định
                'reminders': {
                    'useDefault': false,
                    'overrides': [
                        {'method': 'popup', 'minutes': 30}
                    ]
                }
            };
            
            // Thêm vào hàng đợi gửi
            const request = gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });
            batch.add(request);
            successCount++;
        });

        // Thực thi gửi
        await batch.then(() => {
             toast.success(`Đã thêm ${successCount} công việc vào Google Calendar!`);
        });

    } catch (err) {
        console.error("Lỗi Google API:", err);
        toast.error("Lỗi đồng bộ. Vui lòng thử lại.");
    }
}

// --- 6. CÁC HÀM RENDER BIỂU ĐỒ & UI CŨ (GIỮ NGUYÊN) ---

function updateStats(tasks) {
    const now = new Date();
    const isTaskDone = (t) => {
        if (!t.column || !t.column.title) return false; 
        const title = t.column.title.toLowerCase();
        return title.includes('done') || title.includes('hoàn thành') || title.includes('xong');
    };

    const total = tasks.length;
    const overdue = tasks.filter(t => {
        if (!t.deadline) return false;
        if (isTaskDone(t)) return false; 
        return new Date(t.deadline) < now;
    }).length;
    
    const active = tasks.filter(t => {
        if (isTaskDone(t)) return false; 
        if (t.deadline && new Date(t.deadline) < now) return false; 
        return true;
    }).length; 

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

function renderTimeline(tasks) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    if (chartInstances.timeline) chartInstances.timeline.destroy();

    const now = new Date();
    const isTaskDone = (t) => {
        if (!t.column || !t.column.title) return false;
        const title = t.column.title.toLowerCase();
        return title.includes('done') || title.includes('hoàn thành') || title.includes('xong');
    };

    const validTasks = tasks.filter(t => t.deadline);
    const timelineData = validTasks.map(t => {
        const startRaw = t.startTime ? t.startTime : t.createdAt;
        const start = new Date(startRaw).getTime();
        let end = new Date(t.deadline).getTime();
        if (start > end) end = start + 86400000; 
        return { x: [start, end], y: t.title };
    });

    const timelineColors = validTasks.map(t => {
        if (isTaskDone(t)) return 'rgba(34, 197, 94, 0.85)';
        if (new Date(t.deadline) < now) return 'rgba(229, 62, 62, 0.85)';
        return 'rgba(0, 121, 191, 0.85)';
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
                backgroundColor: timelineColors,
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
                y: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
            }
        }
    });
}

function renderStatusChart(tasks) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (chartInstances.status) chartInstances.status.destroy();

    const now = new Date();
    let stats = { notStarted: 0, inProgress: 0, done: 0, overdue: 0 };

    tasks.forEach(t => {
        const colTitle = (t.column && t.column.title) ? t.column.title.toLowerCase() : '';
        const isDone = colTitle.includes('done') || colTitle.includes('hoàn thành') || colTitle.includes('xong');

        if (isDone) {
            stats.done++;
            return;
        }
        const deadline = t.deadline ? new Date(t.deadline) : null;
        const startTime = t.startTime ? new Date(t.startTime) : null;

        if (deadline && deadline < now) stats.overdue++;
        else if (startTime && startTime > now) stats.notStarted++;
        else stats.inProgress++;
    });

    const dataValues = [stats.notStarted, stats.inProgress, stats.done, stats.overdue];
    
    if (dataValues.every(val => val === 0)) {
        if(chartInstances.status) chartInstances.status.clear();
        return;
    }

    chartInstances.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Chưa bắt đầu', 'Đang làm', 'Đã xong', 'Quá hạn'],
            datasets: [{
                data: dataValues,
                backgroundColor: ['#94a3b8', '#0c66e4', '#22c55e', '#e53e3e'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.chart._metasets[context.datasetIndex].total;
                            let percentage = Math.round((value / total) * 100) + '%';
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

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
            },
            ticks: { stepSize: 1, precision: 0 },
        }
    });
}