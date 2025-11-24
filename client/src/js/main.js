import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- XỬ LÝ LOGIN GOOGLE ---
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        // 1. Lưu token vào bộ nhớ
        localStorage.setItem('maneasily_token', token);
        
        // 2. Xóa token trên thanh địa chỉ để nhìn cho đẹp
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast.success("Đăng nhập Google thành công!");

    }
    // ---------------------------

    // ... (code cũ của home.js)
});