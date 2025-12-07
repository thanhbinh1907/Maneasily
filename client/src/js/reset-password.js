import { toast } from './utils/toast.js';
import { applyTranslation } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    applyTranslation();
    const resetForm = document.getElementById('reset-form');
    const newPassInput = document.getElementById('new-password');
    const confirmPassInput = document.getElementById('confirm-password');
    const errorMsg = document.getElementById('reset-error');

    // Lấy token từ URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        toast.error("Link không hợp lệ hoặc bị thiếu Token.");
        window.location.href = '/src/pages/signin.html';
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = newPassInput.value;
        const confirmPassword = confirmPassInput.value;

        // Validate cơ bản
        if (newPassword.length < 6) {
            errorMsg.textContent = "Mật khẩu phải có ít nhất 6 ký tự.";
            return;
        }
        if (newPassword !== confirmPassword) {
            errorMsg.textContent = "Mật khẩu nhập lại không khớp.";
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Đổi mật khẩu thành công! Đang chuyển hướng...");
                window.location.href = '/src/pages/signin.html';
            } else {
                errorMsg.textContent = data.err || "Lỗi đổi mật khẩu.";
            }
        } catch (err) {
            errorMsg.textContent = "Lỗi kết nối server.";
        }
    });
    
    // Xóa lỗi khi gõ
    confirmPassInput.addEventListener('input', () => errorMsg.textContent = '');
});