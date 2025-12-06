import '../css/components/dashboard-layout.css'; 
import { initProfileModal } from './components/profile-modal.js';
import { showConfirm } from './utils/confirm.js';
import { initNotifications } from './components/notification.js';
import { initSearch } from './components/search.js';
import { API_BASE_URL } from './config.js'; // Đảm bảo import API_BASE_URL

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    const userStr = localStorage.getItem('maneasily_user');

    if (!token || !userStr) {
        window.location.href = '/src/pages/signin.html';
        return;
    }

    const user = JSON.parse(userStr);

    // 2. Hiển thị thông tin cơ bản
    const avatarEl = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    const displayNameEl = document.getElementById('user-display-name');
    const dateEl = document.getElementById('current-date');

    const defaultAvatar = "https://www.gravatar.com/avatar/default?d=mp";

    if (avatarEl) avatarEl.src = user.avatar || defaultAvatar;
    if (nameEl) nameEl.textContent = user.username;
    if (displayNameEl) displayNameEl.textContent = user.username;
    
    // Hiển thị ngày hiện tại
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // --- 3. LOAD DASHBOARD DATA (MỚI) ---
    loadDashboardData();

    async function loadDashboardData() {
        const projList = document.getElementById('recent-projects-list');
        if (!projList) return;

        try {
            const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();

            if (res.ok) {
                // A. Render Stats
                animateValue("stat-projects", 0, data.totalProjects, 500);
                animateValue("stat-tasks-today", 0, data.tasksToday, 500);
                animateValue("stat-tasks-overdue", 0, data.tasksOverdue, 500);

                // B. Render Recent Projects
                if (data.recentProjects && data.recentProjects.length > 0) {
                    projList.innerHTML = data.recentProjects.map(p => `
                        <a href="/src/pages/Board.html?id=${p._id}" class="recent-project-card">
                            <img src="${p.img}" class="project-thumb">
                            <div style="flex-grow:1">
                                <h4 style="margin:0 0 4px 0; font-size:1rem;">${p.title}</h4>
                                <span style="font-size:0.8rem; color:var(--text-sub)">Cập nhật: ${new Date(p.updatedAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <i class="fa-solid fa-chevron-right" style="color:var(--text-placeholder)"></i>
                        </a>
                    `).join('');
                } else {
                    projList.innerHTML = '<p style="color:var(--text-sub); font-style:italic;">Chưa có dự án nào.</p>';
                }

                // C. Load Activities
                loadRecentActivities();
            }
        } catch (err) {
            console.error("Lỗi tải dashboard:", err);
        }
    }

    async function loadRecentActivities() {
        // [GUARD CLAUSE] Kiểm tra phần tử chứa activity
        const actList = document.getElementById('recent-activity-list');
        if (!actList) return;

        try {
            // Sử dụng API activity để lấy dữ liệu
            const res = await fetch(`${API_BASE_URL}/activity/dashboard`, { 
                headers: { 'Authorization': token }
            });
            
            const data = await res.json();
            if (data.boardData) {
                // Gộp tất cả logs từ các project lại
                let allLogs = [];
                data.boardData.forEach(item => {
                    allLogs = [...allLogs, ...item.activities];
                });
                
                // Sắp xếp theo thời gian mới nhất
                allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                const recentLogs = allLogs.slice(0, 5); // Chỉ lấy 5 hoạt động mới nhất

                if (recentLogs.length > 0) {
                    actList.innerHTML = recentLogs.map(log => `
                        <div class="activity-mini-item">
                            <img src="${log.user?.avatar || defaultAvatar}" class="activity-mini-avatar">
                            <div class="activity-mini-content">
                                <strong>${log.user?.username}</strong> ${log.action} <strong>${log.target || ''}</strong>
                                <span class="activity-mini-time">${new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    actList.innerHTML = '<p style="color:var(--text-sub);">Chưa có hoạt động nào.</p>';
                }
            }
        } catch(e) { console.error(e); }
    }

    function animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if(!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) window.requestAnimationFrame(step);
            else obj.innerHTML = end;
        };
        window.requestAnimationFrame(step);
    }

    // 4. Init các thành phần khác
    const themeBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;
    
    if (themeBtn) {
        // Kiểm tra theme đã lưu ngay khi vào trang để set icon đúng
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            // Nếu đang là Dark Mode -> Đổi thành hình Mặt trời
            themeBtn.querySelector('i').className = 'fa-regular fa-sun';
        }    

        themeBtn.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-theme') === 'dark';
            if (!isDark) {
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeBtn.querySelector('i').className = 'fa-regular fa-sun';
            } else {
                htmlElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeBtn.querySelector('i').className = 'fa-regular fa-moon';
            }
        });
    }

    // Dropdown & Logout (Giữ nguyên logic cũ)
    const dropdownTrigger = document.getElementById('user-dropdown-trigger');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        window.addEventListener('click', () => dropdownMenu.classList.remove('show'));
    }
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        showConfirm("Đăng xuất?", () => {
            localStorage.removeItem('maneasily_token');
            localStorage.removeItem('maneasily_user');
            window.location.href = '/src/pages/signin.html';
        });
    });

    initProfileModal();
    initNotifications();
    initSearch();
});