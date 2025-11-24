import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    const msgEl = document.getElementById('status-msg');
    const loader = document.getElementById('loader');
    const btnHome = document.getElementById('btn-home');

    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    if (!token) {
        // Lưu lại link hiện tại để sau khi login quay lại đúng chỗ này
        localStorage.setItem('redirect_after_login', window.location.href);
        
        toast.error("Bạn cần đăng nhập để tham gia dự án.");
        
        // Đợi 1.5s để user kịp đọc thông báo rồi chuyển trang
        setTimeout(() => {
            window.location.href = '/src/pages/signin.html';
        }, 1500);
        return;
    }

    if (!code) {
        msgEl.textContent = "Đường dẫn không hợp lệ (Thiếu mã mời).";
        msgEl.style.color = "#d93025"; // Màu đỏ báo lỗi
        loader.style.display = 'none';
        btnHome.style.display = 'inline-block';
        return;
    }

    // 2. Gọi API tham gia
    try {
        // Sử dụng biến môi trường thay vì hardcode localhost
        const res = await fetch(`${API_BASE_URL}/project/join`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ code })
        });

        const data = await res.json();

        if (res.ok) {
            msgEl.textContent = "Tham gia thành công! Đang chuyển hướng...";
            msgEl.style.color = "#2e8b57"; // Màu xanh thành công
            toast.success("Đã tham gia dự án thành công!");
            
            // Chuyển hướng vào Board sau 1.5s
            setTimeout(() => {
                window.location.href = `/src/pages/Board.html?id=${data.projectId}`;
            }, 1500);
        } else {
            // Xử lý lỗi từ server trả về
            msgEl.textContent = data.err || "Lỗi khi tham gia dự án.";
            msgEl.style.color = "#d93025";
            loader.style.display = 'none';
            btnHome.style.display = 'inline-block';
            
            // Nếu lỗi do "đã là thành viên", hiển thị nút vào luôn
            if (data.projectId) {
                btnHome.textContent = "Vào dự án ngay";
                btnHome.href = `/src/pages/Board.html?id=${data.projectId}`;
                toast.success(data.msg); // "Bạn đã là thành viên..."
            } else {
                toast.error(data.err);
            }
        }
    } catch (err) {
        console.error(err);
        msgEl.textContent = "Lỗi kết nối server.";
        msgEl.style.color = "#d93025";
        loader.style.display = 'none';
        btnHome.style.display = 'inline-block';
        toast.error("Không thể kết nối tới máy chủ.");
    }
});