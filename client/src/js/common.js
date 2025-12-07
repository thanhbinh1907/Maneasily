import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { applyTranslation } from './utils/i18n.js'; // [MỚI]

const originalFetch = window.fetch; 

window.fetch = async (...args) => {
  // Gọi API như bình thường
  const response = await originalFetch(...args);

  // Kiểm tra nếu Server trả về lỗi 401 (Unauthorized)
  if (response.status === 401) {
      // Clone response để đọc nội dung lỗi mà không ảnh hưởng luồng chính
      const clone = response.clone();
      try {
          const data = await clone.json();
          
          // Kiểm tra thông báo lỗi từ Backend (auth.js middleware)
          // Backend trả về: { err: "Phiên đăng nhập hết hạn. Hãy đăng nhập lại." }
          const errorMsg = data.err || "";

          // Chỉ xử lý nếu lỗi liên quan đến Token/Hết hạn và KHÔNG phải đang ở trang đăng nhập
          if (
              (errorMsg.includes("hết hạn") || errorMsg.includes("Token không hợp lệ") || errorMsg.includes("Token missing")) &&
              !window.location.pathname.includes('signin.html')
          ) {
              handleSessionExpired();
              
              // Trả về một promise reject để code ở các file khác dừng lại, không chạy tiếp logic lỗi
              return Promise.reject("Session Expired");
          }
      } catch (e) {
          // Lỗi parse JSON, bỏ qua
      }
  }

  return response;
};

// Hàm xử lý đăng xuất
function handleSessionExpired() {
  // 1. Kiểm tra xem đã xử lý chưa (tránh spam thông báo nếu gọi nhiều API cùng lúc)
  if (localStorage.getItem('session_expired_handling')) return;
  localStorage.setItem('session_expired_handling', 'true');

  // 2. Xóa dữ liệu đăng nhập
  localStorage.removeItem('maneasily_token');
  localStorage.removeItem('maneasily_user');

  // 3. Thông báo
  toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

  // 4. Chuyển hướng sau 2 giây
  setTimeout(() => {
      localStorage.removeItem('session_expired_handling'); // Reset cờ
      window.location.href = '/src/pages/signin.html';
  }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
  applyTranslation();
  // --- 1. XỬ LÝ LOGIN TỪ URL (Callback) ---
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
      localStorage.setItem('maneasily_token', token);
      
      try {
          // SỬA: Dùng API_BASE_URL
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
              method: 'GET',
              headers: { 'Authorization': token }
          });
          
          const data = await res.json();
          
          if (res.ok) {
              localStorage.setItem('maneasily_user', JSON.stringify(data.user));
              toast.success("Đăng nhập thành công!"); // SỬA: Toast
              
              window.history.replaceState({}, document.title, window.location.pathname);
              updateHeaderState();
          } else {
              toast.error("Token không hợp lệ");
              localStorage.removeItem('maneasily_token');
          }
      } catch (err) {
          console.error(err);
          toast.error("Lỗi kết nối xác thực");
      }
  }

  // --- 2. HÀM CẬP NHẬT HEADER ---
  updateHeaderState();

  function updateHeaderState() {
      const storedToken = localStorage.getItem('maneasily_token');
      const storedUser = localStorage.getItem('maneasily_user');
      
      const signinBtn = document.getElementById('nav-signin-btn');
      const signupBtn = document.getElementById('nav-signup-btn');
      const dashboardBtn = document.getElementById('nav-dashboard-btn');

      if (signinBtn && signupBtn && dashboardBtn) {
          if (storedToken && storedUser) {
              signinBtn.style.display = 'none';
              signupBtn.style.display = 'none';
              dashboardBtn.style.display = 'inline-block';
          } else {
              signinBtn.style.display = ''; 
              signupBtn.style.display = '';
              dashboardBtn.style.display = 'none';
          }
      }
  }

  // --- 3. MOBILE NAV ---
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('header nav, .sticky-header nav');

  if (mobileNavToggle && nav) {
    mobileNavToggle.addEventListener('click', () => {
      nav.classList.toggle('nav-visible');
      const icon = mobileNavToggle.querySelector('i');
      if (nav.classList.contains('nav-visible')) {
        icon.classList.replace('fa-bars', 'fa-times');
      } else {
        icon.classList.replace('fa-times', 'fa-bars');
      }
    });
  }
});