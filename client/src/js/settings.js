import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    if (!token) return window.location.href = '/src/pages/signin.html';

    // --- KHAI BÁO CÁC ELEMENT ---
    // Tab Tài khoản
    const avatarInput = document.getElementById('set-avatar');
    const avatarPreview = document.getElementById('preview-avatar');
    const usernameInput = document.getElementById('set-username');
    const emailInput = document.getElementById('set-email');
    
    // Tab Chung
    const themeSelect = document.getElementById('set-theme');
    const langSelect = document.getElementById('set-lang');
    
    // Tab Thông báo
    const notifInvite = document.getElementById('notif-email-invite');
    const notifDeadline = document.getElementById('notif-email-deadline');
    const notifNews = document.getElementById('notif-email-news');
    const notifSound = document.getElementById('notif-sound');
    const notifToast = document.getElementById('notif-toast');
    
    // Tab Riêng tư (Quan trọng)
    const privSearchable = document.getElementById('priv-searchable');
    const privRequireInvite = document.getElementById('priv-require-invite'); // [MỚI]

    const saveBtn = document.getElementById('btn-save-settings');

    // 2. LOAD DỮ LIỆU TỪ SERVER
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        
        if (res.ok) {
            const u = data.user;
            const s = u.settings || {}; // Lấy object settings

            // --- Fill Data ---
            avatarInput.value = u.avatar || '';
            avatarPreview.src = u.avatar || 'https://www.gravatar.com/avatar/default?d=mp';
            usernameInput.value = u.username;
            emailInput.value = u.email;

            // Theme & Lang
            themeSelect.value = s.theme || 'light';
            langSelect.value = s.language || 'vi';
            
            // Notifications (Dùng toán tử ?? để lấy mặc định là true nếu chưa set)
            const n = s.notifications || {};
            notifInvite.checked = n.emailOnInvite ?? true;
            notifDeadline.checked = n.emailOnDeadline ?? true;
            notifNews.checked = n.emailOnNews ?? true;
            notifSound.checked = n.soundEnabled ?? true;
            notifToast.checked = n.toastEnabled ?? true;
            
            // Privacy (Cập nhật mới)
            const p = s.privacy || {};
            // Cho phép tìm kiếm (Mặc định: Bật)
            privSearchable.checked = p.searchable ?? true; 
            // Yêu cầu duyệt (Mặc định: Tắt - tức là tự vào)
            privRequireInvite.checked = p.requireInvite ?? false; 

            // (Optional) Update Theme UI ngay nếu đang sai lệch
            if (s.theme && s.theme !== localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', s.theme);
                localStorage.setItem('theme', s.theme);
            }
        }
    } catch (err) {
        console.error(err);
        toast.error("Lỗi tải cài đặt.");
    }

    // 3. XỬ LÝ PREVIEW ẢNH
    avatarInput.addEventListener('input', () => {
        avatarPreview.src = avatarInput.value || 'https://www.gravatar.com/avatar/default?d=mp';
    });

    // 4. CHUYỂN TAB (Tabs Logic)
    const tabBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.settings-tab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetId = btn.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 5. LƯU CÀI ĐẶT (SAVE)
    saveBtn.addEventListener('click', async () => {
        saveBtn.innerText = "Đang lưu...";
        saveBtn.disabled = true;

        // Gom dữ liệu vào cấu trúc chuẩn
        const newSettings = {
            // Thông tin cơ bản (User Root)
            username: usernameInput.value.trim(),
            avatar: avatarInput.value.trim(),
            
            // Cấu trúc Settings Object
            settings: {
                theme: themeSelect.value,
                language: langSelect.value,
                
                notifications: {
                    emailOnInvite: notifInvite.checked,
                    emailOnDeadline: notifDeadline.checked,

                    soundEnabled: notifSound.checked,
                    toastEnabled: notifToast.checked
                },
                
                privacy: {
                    searchable: privSearchable.checked,
                    requireInvite: privRequireInvite.checked // Lưu biến này thay cho isPrivate
                }
            }
        };

        try {
            const res = await fetch(`${API_BASE_URL}/users/update`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token 
                },
                body: JSON.stringify(newSettings)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Đã lưu cài đặt!");
                
                // Cập nhật LocalStorage với dữ liệu mới nhất từ Server
                localStorage.setItem('maneasily_user', JSON.stringify(data.user));

                // Áp dụng Theme ngay lập tức
                if (newSettings.settings.theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                }

                // Cập nhật Header UI (Avatar/Name)
                const navAvatar = document.getElementById('nav-user-avatar');
                const navName = document.getElementById('nav-user-name');
                if (navAvatar) navAvatar.src = data.user.avatar;
                if (navName) navName.textContent = data.user.username;

            } else {
                toast.error(data.err || "Lỗi lưu cài đặt");
            }
        } catch (e) {
            console.error(e);
            toast.error("Lỗi kết nối server");
        } finally {
            saveBtn.innerText = "Lưu thay đổi";
            saveBtn.disabled = false;
        }
    });

    // 6. ĐỔI MẬT KHẨU (Gửi Email)
    document.getElementById('btn-reset-pass')?.addEventListener('click', async () => {
        const email = emailInput.value;
        if (!email) return;
        
        const btn = document.getElementById('btn-reset-pass');
        const originalText = btn.innerText;
        btn.innerText = "Đang gửi..."; btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email })
            });
            if(res.ok) toast.success("Đã gửi email đặt lại mật khẩu!");
            else toast.error("Có lỗi xảy ra");
        } catch(e) { toast.error("Lỗi kết nối"); }
        finally { btn.innerText = originalText; btn.disabled = false; }
    });
});