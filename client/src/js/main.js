document.addEventListener('DOMContentLoaded', () => {
    // --- XỬ LÝ LOGIN GOOGLE ---
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        // 1. Lưu token vào bộ nhớ
        localStorage.setItem('maneasily_token', token);
        
        // 2. Xóa token trên thanh địa chỉ để nhìn cho đẹp
        window.history.replaceState({}, document.title, window.location.pathname);
        
        alert("Đăng nhập Google thành công!");
        // (Tùy chọn) Fetch thêm thông tin user để lưu vào localStorage nếu cần
    }
    // ---------------------------

    // ... (code cũ của home.js)
});