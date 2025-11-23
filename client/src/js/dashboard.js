import '../css/components/dashboard-layout.css'; // Import CSS nếu dùng Vite build styles

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    const userStr = localStorage.getItem('maneasily_user');

    if (!token || !userStr) {
        alert('Vui lòng đăng nhập trước!');
        window.location.href = '/src/pages/signin.html';
        return;
    }

    const user = JSON.parse(userStr);

    // 2. Hiển thị thông tin lên NavTop và Dashboard
    const avatarEl = document.getElementById('nav-user-avatar');
    const nameEl = document.getElementById('nav-user-name');
    const welcomeMsg = document.getElementById('welcome-msg');

    if (avatarEl) avatarEl.src = user.avatar || "https://www.gravatar.com/avatar/default?d=mp";
    if (nameEl) nameEl.textContent = user.username;
    if (welcomeMsg) welcomeMsg.textContent = `Xin chào, ${user.username}!`;

    // 3. Xử lý Dropdown Menu User
    const dropdownTrigger = document.getElementById('user-dropdown-trigger');
    const dropdownMenu = document.getElementById('user-dropdown-menu');

    if (dropdownTrigger && dropdownMenu) {
        // Toggle khi click vào avatar/tên
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt
            dropdownMenu.classList.toggle('show');
        });

        // Ẩn khi click ra ngoài
        document.addEventListener('click', (e) => {
            if (!dropdownTrigger.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // 4. Xử lý Đăng xuất
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                localStorage.removeItem('maneasily_token');
                localStorage.removeItem('maneasily_user');
                window.location.href = '/src/pages/signin.html';
            }
        });
    }
});