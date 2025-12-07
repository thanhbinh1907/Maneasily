import '../css/components/dashboard-layout.css'; 
import { initProfileModal } from './components/profile-modal.js';
import { showConfirm } from './utils/confirm.js';
import { initNotifications } from './components/notification.js';
import { initSearch } from './components/search.js';
import { API_BASE_URL } from './config.js';
import { applyTranslation, t } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    const userStr = localStorage.getItem('maneasily_user');

    if (!token || !userStr) {
        window.location.href = '/src/pages/signin.html';
        return;
    }

    const user = JSON.parse(userStr);

    // Cập nhật ngôn ngữ nếu setting user khác với localStorage
    if (user.settings && user.settings.language) {
        if (localStorage.getItem('language') !== user.settings.language) {
            localStorage.setItem('language', user.settings.language);
        }
    }
    applyTranslation(); 

    // 2. Hiển thị thông tin cơ bản trên Header
    const avatarEl = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    const displayNameEl = document.getElementById('user-display-name');
    const dateEl = document.getElementById('current-date');

    const defaultAvatar = "https://www.gravatar.com/avatar/default?d=mp";

    if (avatarEl) avatarEl.src = user.avatar || defaultAvatar;
    if (nameEl) nameEl.textContent = user.username;
    if (displayNameEl) displayNameEl.textContent = user.username;
    
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    // --- 3. LOGIC THEME (CÓ TỰ ĐỘNG LƯU) ---
    const themeBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;
    let themeSaveTimer; // Biến timer để debounce việc lưu

    // Hàm helper: Cập nhật giao diện (Icon & Attribute)
    const applyThemeUI = (theme) => {
        if (theme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
            if (themeBtn) themeBtn.querySelector('i').className = 'fa-regular fa-sun';
        } else {
            htmlElement.removeAttribute('data-theme');
            if (themeBtn) themeBtn.querySelector('i').className = 'fa-regular fa-moon';
        }
        localStorage.setItem('theme', theme);
    };

    // Khởi tạo trạng thái ban đầu từ localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyThemeUI(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // 1. Cập nhật Giao diện & LocalStorage ngay lập tức (cho mượt)
            applyThemeUI(newTheme);

            // 2. Phát sự kiện đồng bộ với trang Settings (nếu đang mở)
            window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));

            // 3. [MỚI] Tự động lưu vào Server (Debounce 1s)
            // Nếu người dùng bấm liên tục, chỉ lưu lần cuối cùng sau khi dừng 1s
            clearTimeout(themeSaveTimer);
            themeSaveTimer = setTimeout(async () => {
                const currentUserStr = localStorage.getItem('maneasily_user');
                if (!currentUserStr) return;
                
                const currentUser = JSON.parse(currentUserStr);
                // Giữ lại các settings cũ, chỉ thay đổi theme
                const currentSettings = currentUser.settings || {};
                const newSettings = { ...currentSettings, theme: newTheme };

                // Chuẩn bị dữ liệu gửi (Backend yêu cầu cả username/avatar khi update)
                const payload = {
                    username: currentUser.username,
                    avatar: currentUser.avatar,
                    settings: newSettings
                };

                try {
                    await fetch(`${API_BASE_URL}/users/update`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': token
                        },
                        body: JSON.stringify(payload)
                    });
                    
                    // Cập nhật lại thông tin User trong LocalStorage để đồng bộ
                    currentUser.settings = newSettings;
                    localStorage.setItem('maneasily_user', JSON.stringify(currentUser));
                    // console.log("Theme saved to server:", newTheme);
                } catch (e) {
                    console.error("Lỗi lưu theme tự động:", e);
                }
            }, 1000);
        });
    }

    // Lắng nghe sự kiện từ Settings (để đồng bộ ngược lại nếu đổi từ trang Settings)
    window.addEventListener('theme-change', (e) => {
        const newTheme = e.detail;
        applyThemeUI(newTheme);
    });
    // ------------------------------------------

    // --- 4. LOAD DASHBOARD DATA ---
    loadDashboardData();

    async function loadDashboardData() {
        const projList = document.getElementById('recent-projects-list');
        if (!projList) return; // Nếu không ở trang dashboard thì bỏ qua

        try {
            const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();

            if (res.ok) {
                animateValue("stat-projects", 0, data.totalProjects, 500);
                animateValue("stat-tasks-today", 0, data.tasksToday, 500);
                animateValue("stat-tasks-overdue", 0, data.tasksOverdue, 500);

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
                    projList.innerHTML = `<p style="color:var(--text-sub); font-style:italic;">${t('dash.no_project')}</p>`;
                }

                loadRecentActivities();
            }
        } catch (err) {
            console.error("Lỗi tải dashboard:", err);
        }
    }

    async function loadRecentActivities() {
        const actList = document.getElementById('recent-activity-list');
        if (!actList) return;

        try {
            const res = await fetch(`${API_BASE_URL}/activity/dashboard`, { 
                headers: { 'Authorization': token }
            });
            
            const data = await res.json();
            if (data.boardData) {
                let allLogs = [];
                data.boardData.forEach(item => {
                    allLogs = [...allLogs, ...item.activities];
                });
                
                allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const recentLogs = allLogs.slice(0, 5); 

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
                    actList.innerHTML = `<p style="color:var(--text-sub);">${t('dash.no_activity')}</p>`;
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

    // 5. Init các thành phần UI khác
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
        showConfirm(t('nav.logout') + "?", () => {
            localStorage.removeItem('maneasily_token');
            localStorage.removeItem('maneasily_user');
            window.location.href = '/src/pages/signin.html';
        });
    });

    initProfileModal();
    initNotifications();
    initSearch();
});