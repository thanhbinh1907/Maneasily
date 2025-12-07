import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import '../css/components/modal.css'; // Import CSS cho modal quên pass
import { applyTranslation } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', () => {
    applyTranslation();
    const signinForm = document.getElementById('signin-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btnGoogle = document.getElementById('btn-google');
    const btnGithub = document.getElementById('btn-github');

    if (btnGoogle) {
        // Kết quả sẽ là: https://server-cua-ban.onrender.com/api/auth/google
        btnGoogle.href = `${API_BASE_URL}/auth/google`; 
    }
    if (btnGithub) {
        btnGithub.href = `${API_BASE_URL}/auth/github`;
    }

    // --- XỬ LÝ ĐĂNG NHẬP ---
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validation đơn giản
        if(!emailInput.value || !passwordInput.value) {
            return toast.error("Vui lòng điền đầy đủ thông tin");
        }

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: emailInput.value.trim(), 
                    password: passwordInput.value.trim() 
                })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('maneasily_token', data.token);
                localStorage.setItem('maneasily_user', JSON.stringify(data.user));
                
                toast.success("Đăng nhập thành công!");
                
                // Redirect thông minh
                const redirect = localStorage.getItem('redirect_after_login') || '/index.html';
                localStorage.removeItem('redirect_after_login');
                
                setTimeout(() => window.location.href = redirect, 1000);
            } else {
                toast.error(data.err || "Đăng nhập thất bại");
            }
        } catch (err) {
            console.error(err);
            toast.error("Không thể kết nối đến Server");
        }
    });

    // --- XỬ LÝ QUÊN MẬT KHẨU (GỌN GÀNG) ---
    const forgotModal = document.getElementById('forgot-modal');
    const forgotForm = document.getElementById('forgot-form');
    
    document.querySelector('.forgot-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.style.display = 'flex';
    });

    document.getElementById('close-forgot')?.addEventListener('click', () => {
        forgotModal.style.display = 'none';
    });

    forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const btn = forgotForm.querySelector('button');
        
        btn.innerText = "Đang gửi..."; btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if(res.ok) {
                toast.success(data.msg);
                forgotModal.style.display = 'none';
            } else {
                toast.error(data.err);
            }
        } catch(err) { toast.error("Lỗi server"); } 
        finally { btn.innerText = "Gửi link"; btn.disabled = false; }
    });
});