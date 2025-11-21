document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        // 1. Lưu token vào bộ nhớ
        localStorage.setItem('maneasily_token', token);
        
        // 2. Xóa token trên thanh địa chỉ để nhìn cho đẹp
        window.history.replaceState({}, document.title, window.location.pathname);
        
        alert("Đăng nhập thành công!");
        // (Tùy chọn) Fetch thêm thông tin user để lưu vào localStorage nếu cần
    }
  // Logic cho Hamburger Menu
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('header nav, .sticky-header nav');

  if (mobileNavToggle && nav) {
    mobileNavToggle.addEventListener('click', () => {
      nav.classList.toggle('nav-visible');
      
      // Đổi icon (từ 'bars' sang 'times' và ngược lại)
      const icon = mobileNavToggle.querySelector('i');
      if (nav.classList.contains('nav-visible')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  }
});