import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { setLanguage, getLanguage, t } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    if (!token) return window.location.href = '/src/pages/signin.html';

    // --- KHAI BÁO CÁC ELEMENT (Đặt trong try-catch hoặc kiểm tra null nếu cần) ---
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
    // const notifNews = document.getElementById('notif-email-news'); // (Có thể bỏ nếu HTML không có)
    const notifSound = document.getElementById('notif-sound');
    const notifToast = document.getElementById('notif-toast');
    
    // Tab Riêng tư
    const privSearchable = document.getElementById('priv-searchable');
    const privRequireInvite = document.getElementById('priv-require-invite');

    const saveBtn = document.getElementById('btn-save-settings');

    // Helper: Kiểm tra element tồn tại trước khi gán
    const setChecked = (el, val) => { if (el) el.checked = val; };
    const setValue = (el, val) => { if (el) el.value = val; };

    // --- [MỚI] LẮNG NGHE SỰ KIỆN TỪ HEADER ---
    // Nếu người dùng bấm nút trăng/sao trên header, cập nhật select box này ngay lập tức
    window.addEventListener('theme-change', (e) => {
        if (themeSelect) {
            themeSelect.value = e.detail; 
        }
    });

    // 2. LOAD DỮ LIỆU TỪ SERVER
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        
        if (res.ok) {
            const u = data.user;
            const s = u.settings || {}; 

            // --- Fill Data ---
            if (avatarInput) avatarInput.value = u.avatar || '';
            if (avatarPreview) avatarPreview.src = u.avatar || 'https://www.gravatar.com/avatar/default?d=mp';
            if (usernameInput) usernameInput.value = u.username;
            if (emailInput) emailInput.value = u.email;

            // Theme & Lang
            if (themeSelect) themeSelect.value = s.theme || 'light';
            
            // [LOGIC ĐA NGÔN NGỮ]
            // Ưu tiên localStorage (để UX mượt), sau đó đến DB
            const currentLang = localStorage.getItem('language') || s.language || 'vi';
            if (langSelect) langSelect.value = currentLang;
            setLanguage(currentLang); // Apply ngay

            // Notifications
            const n = s.notifications || {};
            setChecked(notifInvite, n.emailOnInvite ?? true);
            setChecked(notifDeadline, n.emailOnDeadline ?? true);
            // setChecked(notifNews, n.emailOnNews ?? true);
            setChecked(notifSound, n.soundEnabled ?? true);
            setChecked(notifToast, n.toastEnabled ?? true);
            
            // Privacy
            const p = s.privacy || {};
            setChecked(privSearchable, p.searchable ?? true);
            setChecked(privRequireInvite, p.requireInvite ?? false);

            // Update Theme UI
            if (s.theme) {
                document.documentElement.setAttribute('data-theme', s.theme);
                localStorage.setItem('theme', s.theme);
            }
        }
    } catch (err) {
        console.error(err);
        toast.error("Lỗi tải cài đặt.");
    }

    // 3. XỬ LÝ PREVIEW ẢNH
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('input', () => {
            avatarPreview.src = avatarInput.value || 'https://www.gravatar.com/avatar/default?d=mp';
        });
    }

    // 4. CHUYỂN TAB (Tabs Logic)
    const tabBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.settings-tab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetId = btn.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // 5. LƯU CÀI ĐẶT (SAVE)
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            // Dùng hàm t() để dịch nút
            const originalBtnText = t("settings.save_btn");
            saveBtn.innerText = t("settings.saving");
            saveBtn.disabled = true;

            // Lấy giá trị an toàn
            const username = usernameInput ? usernameInput.value.trim() : "";
            const avatar = avatarInput ? avatarInput.value.trim() : "";
            const theme = themeSelect ? themeSelect.value : "light";
            const language = langSelect ? langSelect.value : "vi";

            // Gom dữ liệu
            const newSettings = {
                username: username,
                avatar: avatar,
                settings: {
                    theme: theme,
                    language: language,
                    notifications: {
                        emailOnInvite: notifInvite ? notifInvite.checked : true,
                        emailOnDeadline: notifDeadline ? notifDeadline.checked : true,
                        // emailOnNews: notifNews ? notifNews.checked : true,
                        soundEnabled: notifSound ? notifSound.checked : true,
                        toastEnabled: notifToast ? notifToast.checked : true
                    },
                    privacy: {
                        searchable: privSearchable ? privSearchable.checked : true,
                        requireInvite: privRequireInvite ? privRequireInvite.checked : false
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
                    toast.success(t("msg.update_success"));
                    
                    localStorage.setItem('maneasily_user', JSON.stringify(data.user));

                    // Áp dụng Theme
                    if (newSettings.settings.theme === 'dark') {
                        document.documentElement.setAttribute('data-theme', 'dark');
                        localStorage.setItem('theme', 'dark');
                    } else {
                        document.documentElement.removeAttribute('data-theme');
                        localStorage.setItem('theme', 'light');
                    }

                    // --- [MỚI] PHÁT SỰ KIỆN ĐỂ HEADER BIẾT ---
                    // Giúp nút icon trên header (Mặt trăng/Mặt trời) đổi ngay lập tức
                    window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }));

                    // Áp dụng Ngôn ngữ ngay lập tức
                    setLanguage(language);

                    // Cập nhật Header UI (Avatar, Tên)
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
                // Cập nhật lại text nút sau khi ngôn ngữ có thể đã đổi
                saveBtn.innerText = t("settings.save_btn");
                saveBtn.disabled = false;
            }
        });
    }

    // 6. ĐỔI MẬT KHẨU
    document.getElementById('btn-reset-pass')?.addEventListener('click', async () => {
        if (!emailInput) return;
        const email = emailInput.value;
        if (!email) return;
        
        const btn = document.getElementById('btn-reset-pass');
        const originalText = btn.innerText;
        btn.innerText = "Processing..."; btn.disabled = true;

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