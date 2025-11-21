document.addEventListener('DOMContentLoaded', () => {
  const signinForm = document.getElementById('signin-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');

  function showError(inputElement, errorElement, message) {
    errorElement.textContent = message;
    inputElement.classList.add('input-error');
  }

  function clearError(inputElement, errorElement) {
    errorElement.textContent = '';
    inputElement.classList.remove('input-error');
  }

  signinForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    
    let isValid = true;

    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Kiểm tra sơ bộ
    if (email === '') {
      showError(emailInput, emailError, 'Email không được để trống.');
      isValid = false;
    }
    if (password === '') {
      showError(passwordInput, passwordError, 'Mật khẩu không được để trống.');
      isValid = false;
    }

    // --- GỬI DỮ LIỆU ĐĂNG NHẬP ---
    if (isValid) {
      console.log('Đang đăng nhập...');
      try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          // Xử lý lỗi (ví dụ: sai mật khẩu, chưa kích hoạt email)
          if (data.err) {
             // Hiển thị lỗi chung ở dưới ô mật khẩu hoặc alert
             showError(passwordInput, passwordError, data.err);
          } else {
             alert('Đăng nhập thất bại.');
          }
        } else {
          // ĐĂNG NHẬP THÀNH CÔNG!
          console.log('Token nhận được:', data.token);
          
          // 1. Lưu Token vào bộ nhớ trình duyệt (localStorage)
          // Đây là "chìa khóa" để người dùng giữ trạng thái đăng nhập
          localStorage.setItem('maneasily_token', data.token);
          
          // 2. Lưu thông tin user (để hiển thị tên, avatar...)
          localStorage.setItem('maneasily_user', JSON.stringify(data.user));

          alert('Đăng nhập thành công!');
          
          // 3. Chuyển hướng vào trang chính (Board hoặc Home)
          // Bạn hãy sửa đường dẫn này tới trang bạn muốn user vào sau khi login
          window.location.href = '/index.html'; 
        }
      } catch (err) {
        console.error('Lỗi kết nối:', err);
        alert('Không thể kết nối đến Server.');
      }
    }
  });

  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));

  
  // --- LOGIC MODAL FORGOT PASSWORD ---
const forgotLink = document.querySelector('.forgot-password');
const modal = document.getElementById('forgot-modal');
const closeModal = document.querySelector('.close-modal');
const forgotForm = document.getElementById('forgot-form');
const forgotEmailInput = document.getElementById('forgot-email');
const forgotError = document.getElementById('forgot-email-error');

// Mở modal
if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'flex';
  });
}

// Đóng modal
if (closeModal) {
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    forgotForm.reset();
    forgotError.textContent = '';
  });
}

// Click ra ngoài để đóng
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// Xử lý submit form quên mật khẩu
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotEmailInput.value.trim();

    if (!email) {
      forgotError.textContent = "Vui lòng nhập email.";
      return;
    }

    // Hiển thị trạng thái loading (tùy chọn)
    const submitBtn = forgotForm.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.msg);
        modal.style.display = 'none';
        forgotForm.reset();
      } else {
        forgotError.textContent = data.err || "Có lỗi xảy ra.";
      }
    } catch (err) {
      forgotError.textContent = "Lỗi kết nối server.";
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}
});