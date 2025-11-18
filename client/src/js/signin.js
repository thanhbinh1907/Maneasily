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
});