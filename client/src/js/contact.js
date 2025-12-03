import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = contactForm.querySelector('.btn-send');
            const originalText = btn.innerText;
            
            // Lấy dữ liệu từ form
            const name = document.getElementById('c-name').value.trim();
            const email = document.getElementById('c-email').value.trim();
            const subject = document.getElementById('c-subject').value;
            const message = document.getElementById('c-message').value.trim();

            if (!name || !email || !message) {
                return toast.error("Vui lòng điền đầy đủ thông tin.");
            }

            // Hiệu ứng đang gửi
            btn.innerText = "Đang gửi...";
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });

                const data = await res.json();

                if (res.ok) {
                    toast.success(data.msg || "Đã gửi tin nhắn thành công!");
                    contactForm.reset();
                } else {
                    toast.error(data.err || "Gửi thất bại.");
                }
            } catch (err) {
                console.error(err);
                toast.error("Lỗi kết nối server.");
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }
});