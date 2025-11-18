document.addEventListener('DOMContentLoaded', () => {
  // 1. Lấy các phần tử từ HTML
  const signupForm = document.getElementById('signup-form');
  const emailInput = document.getElementById('email');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  
  const emailError = document.getElementById('email-error');
  const usernameError = document.getElementById('username-error'); 
  const passwordError = document.getElementById('password-error');

  // --- Hàm hiển thị lỗi ---
  function showError(inputElement, errorElement, message) {
    errorElement.textContent = message;
    inputElement.classList.add('input-error');
  }

  // --- Hàm xóa lỗi ---
  function clearError(inputElement, errorElement) {
    errorElement.textContent = '';
    inputElement.classList.remove('input-error');
  }

  // --- Hàm kiểm tra định dạng email ---
  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // 2. Xử lý sự kiện khi bấm nút "Sign Up"
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Ngăn trình duyệt reload trang
    
    let isValid = true; 

    // Reset các lỗi cũ trước khi kiểm tra mới
    clearError(emailInput, emailError);
    clearError(usernameInput, usernameError);
    clearError(passwordInput, passwordError);

    // Lấy giá trị người dùng nhập
    const email = emailInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // --- BẮT ĐẦU KIỂM TRA (VALIDATION) ---

    // Kiểm tra Email
    if (email === '') {
      showError(emailInput, emailError, 'Email không được để trống.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError(emailInput, emailError, 'Vui lòng nhập email hợp lệ.');
      isValid = false;
    }

    // Kiểm tra Username
    if (username === '') {
      showError(usernameInput, usernameError, 'Username không được để trống.');
      isValid = false;
    } else if (username.length < 6) {
      showError(usernameInput, usernameError, 'Username phải có ít nhất 6 ký tự.');
      isValid = false;
    }

    // Kiểm tra Password
    if (password === '') {
      showError(passwordInput, passwordError, 'Mật khẩu không được để trống.');
      isValid = false;
    } else if (password.length < 6) { // Server yêu cầu tối thiểu 6 ký tự
      showError(passwordInput, passwordError, 'Mật khẩu phải có ít nhất 6 ký tự.');
      isValid = false;
    }

    // --- GỬI DỮ LIỆU LÊN SERVER ---
    if (isValid) {
      console.log('Dữ liệu hợp lệ. Đang gửi đến server...');
      
      try {
        // Gọi API đăng ký
        const res = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json' // Báo cho server biết mình gửi JSON
          },
          body: JSON.stringify({
            email: email,
            username: username,
            password: password
          })
        });

        const data = await res.json(); // Đọc phản hồi từ server

        if (!res.ok) {
          // Nếu server trả về lỗi (ví dụ: 400 Bad Request)
          console.error('Lỗi từ server:', data.err);
          
          // Hiển thị lỗi tương ứng vào đúng ô
          if (data.err && data.err.toLowerCase().includes("email")) {
             showError(emailInput, emailError, data.err);
          } else if (data.err && data.err.toLowerCase().includes("username")) {
             showError(usernameInput, usernameError, data.err);
          } else {
             // Lỗi chung chung
             alert(data.err || 'Đăng ký thất bại.');
          }
        } else {
          // Đăng ký thành công (Server trả về 200 OK)
          alert(data.msg); // "Đăng ký thành công! Vui lòng kiểm tra email..."
          
          // Xóa trắng form
          signupForm.reset();
          
          // (Tùy chọn) Chuyển hướng người dùng sang trang đăng nhập
          // window.location.href = '/src/pages/signin.html';
        }

      } catch (err) {
        // Lỗi mạng (không kết nối được server)
        console.error('Lỗi kết nối:', err);
        alert('Không thể kết nối đến Server. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.');
      }
    }
  });

  // Tự động xóa lỗi khi người dùng bắt đầu gõ lại
  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  usernameInput.addEventListener('input', () => clearError(usernameInput, usernameError));
  passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));
});