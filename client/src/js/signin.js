document.addEventListener('DOMContentLoaded', () => {
  // 1. Lấy các phần tử DOM cần thiết
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

  function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // 2. Thêm sự kiện "submit" cho form
  signinForm.addEventListener('submit', (event) => {
    event.preventDefault(); 
    
    let isValid = true;

    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // --- 3. Bắt đầu kiểm tra (Validation) ---

    if (email === '') {
      showError(emailInput, emailError, 'Email cannot be empty.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError(emailInput, emailError, 'Please enter a valid email address.');
      isValid = false;
    }

    if (password === '') {
      showError(passwordInput, passwordError, 'Password cannot be empty.');
      isValid = false;
    }

    // --- 4. Xử lý kết quả ---
    if (isValid) {
      console.log('Form is valid. Submitting data...');
      alert('Sign in successful!');
      
      window.location.href = 'home.html';
    } else {
      console.log('Form is invalid. Please check errors.');
    }
  });

  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));

});