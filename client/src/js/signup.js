import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { applyTranslation } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    applyTranslation();
    const signupForm = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Kiểm tra nếu không tìm thấy form thì dừng (tránh lỗi ở các trang khác)
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // --- 1. Validate cơ bản (Client-side) ---
        // Không cần show error đỏ từng ô nữa, toast sẽ lo việc thông báo
        if (!email || !username || !password) {
            return toast.error("Vui lòng điền đầy đủ thông tin.");
        }
        
        if (username.length < 6) {
            return toast.error("Tên đăng nhập phải có ít nhất 6 ký tự.");
        }

        if (password.length < 6) {
            return toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
        }

        // --- 2. Hiệu ứng Loading cho nút ---
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Đang đăng ký...";
        submitBtn.disabled = true;

        try {
            // --- 3. Gọi API ---
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password })
            });

            const data = await res.json();

            if (res.ok) {
                // --- 4. Thành công ---
                // Backend trả về msg: "Đăng ký thành công! Vui lòng kiểm tra email..."
                toast.success(data.msg);
                
                // Chuyển hướng sang trang đăng nhập sau 2 giây để user kịp đọc thông báo
                setTimeout(() => {
                    window.location.href = '/src/pages/signin.html';
                }, 2000);
            } else {
                // --- 5. Lỗi từ Server (Trùng email, user...) ---
                toast.error(data.err || "Đăng ký thất bại.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Không thể kết nối đến Server.");
        } finally {
            // --- 6. Reset trạng thái nút ---
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});