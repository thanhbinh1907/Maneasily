import '../css/components/dashboard-layout.css'; 
import { initProfileModal } from './components/profile-modal.js';
import { showConfirm } from './utils/confirm.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    const userStr = localStorage.getItem('maneasily_user');

    if (!token || !userStr) {
        // Không dùng alert chặn người dùng nữa, chuyển trang luôn
        window.location.href = '/src/pages/signin.html';
        return;
    }

    const user = JSON.parse(userStr);

    // 2. Hiển thị thông tin User lên NavTop
    const avatarEl = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    const welcomeMsg = document.getElementById('welcome-msg'); // Chỉ có ở trang Dashboard

    // Fallback avatar nếu link lỗi
    const defaultAvatar = "https://www.gravatar.com/avatar/default?d=mp";

    if (avatarEl) {
        avatarEl.src = user.avatar || defaultAvatar;
        avatarEl.onerror = () => avatarEl.src = defaultAvatar;
    }
    if (nameEl) nameEl.textContent = user.username;
    if (welcomeMsg) welcomeMsg.textContent = `Xin chào, ${user.username}!`;

    // 3. Dropdown Menu & Logout
    const dropdownTrigger = document.getElementById('user-dropdown-trigger');
    const dropdownMenu = document.getElementById('user-dropdown-menu');

    if (dropdownTrigger && dropdownMenu) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!dropdownTrigger.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            showConfirm("Bạn có chắc chắn muốn đăng xuất?", () => {
                localStorage.removeItem('maneasily_token');
                localStorage.removeItem('maneasily_user');
                window.location.href = '/src/pages/signin.html';
            });
        });
    }

    // 4. KÍCH HOẠT MODAL HỒ SƠ (TỰ ĐỘNG CHÈN HTML VÀO TRANG)
    initProfileModal();
});