// File: Maneasily/client/src/js/common.js

document.addEventListener('DOMContentLoaded', async () => {
  
  // --- 1. XỬ LÝ LOGIN TỪ URL (Google/GitHub Callback) ---
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
      // 1. Lưu token tạm thời
      localStorage.setItem('maneasily_token', token);
      
      // 2. Gọi API để lấy thông tin User (maneasily_user)
      try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
              method: 'GET',
              headers: {
                  'Authorization': token
              }
          });
          
          const data = await res.json();
          
          if (res.ok) {
              // 3. Lưu thông tin user vào localStorage (Cái Dashboard cần là cái này!)
              localStorage.setItem('maneasily_user', JSON.stringify(data.user));
              
              alert("Đăng nhập thành công!");
              
              // Xóa token trên URL cho đẹp
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Cập nhật header ngay lập tức
              updateHeaderState();
          } else {
              alert("Lỗi xác thực: " + (data.err || "Token không hợp lệ"));
              localStorage.removeItem('maneasily_token'); // Xóa token lỗi
          }
      } catch (err) {
          console.error(err);
          alert("Không thể kết nối để lấy thông tin người dùng.");
      }
  }

  // --- 2. HÀM CẬP NHẬT TRẠNG THÁI HEADER ---
  function updateHeaderState() {
      const storedToken = localStorage.getItem('maneasily_token');
      const storedUser = localStorage.getItem('maneasily_user'); // Kiểm tra cả user cho chắc chắn
      
      // Lấy các phần tử nút trên Header
      const signinBtn = document.getElementById('nav-signin-btn');
      const signupBtn = document.getElementById('nav-signup-btn');
      const dashboardBtn = document.getElementById('nav-dashboard-btn');

      // Chỉ chạy nếu các nút này tồn tại trên trang hiện tại
      if (signinBtn && signupBtn && dashboardBtn) {
          if (storedToken && storedUser) {
              // TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP
              // Ẩn Sign In & Sign Up
              signinBtn.style.display = 'none';
              signupBtn.style.display = 'none';
              
              // Hiện nút Dashboard
              dashboardBtn.style.display = 'inline-block'; // Hoặc 'inline-flex' tùy CSS
          } else {
              // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP
              // Hiện lại Sign In & Sign Up (Xóa style display: none để về mặc định CSS)
              signinBtn.style.display = ''; 
              signupBtn.style.display = '';
              
              // Ẩn nút Dashboard
              dashboardBtn.style.display = 'none';
          }
      }
  }

  // Gọi hàm này ngay khi trang load xong để check trạng thái
  updateHeaderState();


  // --- 3. LOGIC HAMBURGER MENU (Cho Mobile) ---
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