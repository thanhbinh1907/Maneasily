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
    const notifNews = document.getElementById('notif-email-news');
    const notifSound = document.getElementById('notif-sound');
    const notifToast = document.getElementById('notif-toast');
    
    // [CẬP NHẬT] Các element cho phần Deadline Reminder
    const notifDeadlineToggle = document.getElementById('notif-deadline-toggle');
    const deadlineConfigArea = document.getElementById('deadline-config-area');
    const daysInput = document.getElementById('set-days-before');
    const hoursInput = document.getElementById('set-hours-before');
    
    // Tab Riêng tư
    const privSearchable = document.getElementById('priv-searchable');
    const privRequireInvite = document.getElementById('priv-require-invite');

    const saveBtn = document.getElementById('btn-save-settings');

    // Hàm ẩn/hiện khu vực cấu hình Deadline
    const toggleDeadlineConfig = () => {
        if (deadlineConfigArea && notifDeadlineToggle) {
            deadlineConfigArea.style.display = notifDeadlineToggle.checked ? 'block' : 'none';
        }
    };

    // Lắng nghe sự kiện toggle
    if (notifDeadlineToggle) {
        notifDeadlineToggle.addEventListener('change', toggleDeadlineConfig);
    }

    // 2. LOAD DỮ LIỆU TỪ SERVER
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        
        if (res.ok) {
            const u = data.user;
            const s = u.settings || {}; 
            const n = s.notifications || {};

            // --- Fill Data ---
            avatarInput.value = u.avatar || '';
            avatarPreview.src = u.avatar || 'https://www.gravatar.com/avatar/default?d=mp';
            usernameInput.value = u.username;
            emailInput.value = u.email;

            // Theme & Lang
            themeSelect.value = s.theme || 'light';
            langSelect.value = s.language || 'vi';
            
            // Notifications cơ bản
            notifInvite.checked = n.emailOnInvite ?? true;
            notifNews.checked = n.emailOnNews ?? true;
            notifSound.checked = n.soundEnabled ?? true;
            notifToast.checked = n.toastEnabled ?? true;
            
            // [CẬP NHẬT] Load cấu hình Deadline
            // Nếu DB cũ chưa có deadlineReminder thì dùng default
            const dl = n.deadlineReminder || { enabled: true, daysBefore: 1, hoursBefore: 2 };
            
            if (notifDeadlineToggle) notifDeadlineToggle.checked = dl.enabled;
            if (daysInput) daysInput.value = dl.daysBefore;
            if (hoursInput) hoursInput.value = dl.hoursBefore;
            
            // Chạy logic ẩn hiện lần đầu
            toggleDeadlineConfig();

            // Privacy
            const p = s.privacy || {};
            privSearchable.checked = p.searchable ?? true; 
            privRequireInvite.checked = p.requireInvite ?? false; 

            // Update Theme UI nếu cần
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

        // [CẬP NHẬT] Lấy giá trị Deadline, đảm bảo là số nguyên
        const daysVal = parseInt(daysInput.value) || 1;
        const hoursVal = parseInt(hoursInput.value) || 2;

        const newSettings = {
            username: usernameInput.value.trim(),
            avatar: avatarInput.value.trim(),
            
            settings: {
                theme: themeSelect.value,
                language: langSelect.value,
                
                notifications: {
                    emailOnInvite: notifInvite.checked,
                    emailOnNews: notifNews.checked,
                    soundEnabled: notifSound.checked,
                    toastEnabled: notifToast.checked,
                    
                    // [MỚI] Object deadlineReminder
                    deadlineReminder: {
                        enabled: notifDeadlineToggle.checked,
                        daysBefore: daysVal,
                        hoursBefore: hoursVal
                    }
                },
                
                privacy: {
                    searchable: privSearchable.checked,
                    requireInvite: privRequireInvite.checked
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
                
                // Cập nhật LocalStorage
                localStorage.setItem('maneasily_user', JSON.stringify(data.user));

                // Áp dụng Theme
                if (newSettings.settings.theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                }

                // Cập nhật Header UI
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

    // 6. ĐỔI MẬT KHẨU
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