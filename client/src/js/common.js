import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  
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