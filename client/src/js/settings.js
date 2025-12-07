// File: client/src/js/settings.js
import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { setLanguage, getLanguage, t } from './utils/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Kiểm tra đăng nhập
    const token = localStorage.getItem('maneasily_token');
    if (!token) return window.location.href = '/src/pages/signin.html';

    // --- KHAI BÁO ELEMENT ---
    const avatarInput = document.getElementById('set-avatar');
    const avatarPreview = document.getElementById('preview-avatar');
    const usernameInput = document.getElementById('set-username');
    const emailInput = document.getElementById('set-email');
    const themeSelect = document.getElementById('set-theme');
    const langSelect = document.getElementById('set-lang');
    
    const notifInvite = document.getElementById('notif-email-invite');
    const notifSound = document.getElementById('notif-sound');
    const notifToast = document.getElementById('notif-toast');
    
    // [MỚI] Các element cho Deadline Reminder
    const deadlineToggle = document.getElementById('deadline-enable-toggle');
    const deadlineOptions = document.getElementById('deadline-options');
    const deadlineDays = document.getElementById('deadline-days');
    const deadlineHours = document.getElementById('deadline-hours');

    const privSearchable = document.getElementById('priv-searchable');
    const privRequireInvite = document.getElementById('priv-require-invite');
    const saveBtn = document.getElementById('btn-save-settings');

    const setChecked = (el, val) => { if (el) el.checked = val; };

    // --- [MỚI] LẮNG NGHE SỰ KIỆN TỪ HEADER ---
    window.addEventListener('theme-change', (e) => {
        if (themeSelect) themeSelect.value = e.detail; 
    });

    // --- [MỚI] LOGIC ẨN HIỆN DEADLINE OPTIONS ---
    if (deadlineToggle) {
        deadlineToggle.addEventListener('change', () => {
            if (deadlineToggle.checked) {
                deadlineOptions.style.display = 'block';
            } else {
                deadlineOptions.style.display = 'none';
            }
        });
    }

    // 2. LOAD DỮ LIỆU
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        
        if (res.ok) {
            const u = data.user;
            const s = u.settings || {}; 

            if (avatarInput) avatarInput.value = u.avatar || '';
            if (avatarPreview) avatarPreview.src = u.avatar || 'https://www.gravatar.com/avatar/default?d=mp';
            if (usernameInput) usernameInput.value = u.username;
            if (emailInput) emailInput.value = u.email;
            if (themeSelect) themeSelect.value = s.theme || 'light';
            
            const currentLang = localStorage.getItem('language') || s.language || 'vi';
            if (langSelect) langSelect.value = currentLang;
            setLanguage(currentLang);

            // Notifications
            const n = s.notifications || {};
            setChecked(notifInvite, n.emailOnInvite ?? true);
            setChecked(notifSound, n.soundEnabled ?? true);
            setChecked(notifToast, n.toastEnabled ?? true);
            
            // [MỚI] Load Deadline Settings (khớp với model Backend)
            const d = n.deadlineReminder || {};
            const isDeadlineEnabled = d.enabled ?? true;
            setChecked(deadlineToggle, isDeadlineEnabled);
            
            if (deadlineDays) deadlineDays.value = d.daysBefore ?? 1;
            if (deadlineHours) deadlineHours.value = d.hoursBefore ?? 2;

            // Kích hoạt trạng thái hiển thị ban đầu
            if (deadlineOptions) {
                deadlineOptions.style.display = isDeadlineEnabled ? 'block' : 'none';
            }

            // Privacy
            const p = s.privacy || {};
            setChecked(privSearchable, p.searchable ?? true);
            setChecked(privRequireInvite, p.requireInvite ?? false);

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

    // 4. CHUYỂN TAB
    const tabBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.settings-tab');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            document.getElementById(targetId)?.classList.add('active');
        });
    });

    // 5. LƯU CÀI ĐẶT (SAVE)
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const originalBtnText = t("settings.save_btn");
            saveBtn.innerText = t("settings.saving");
            saveBtn.disabled = true;

            const username = usernameInput ? usernameInput.value.trim() : "";
            const avatar = avatarInput ? avatarInput.value.trim() : "";
            const theme = themeSelect ? themeSelect.value : "light";
            const language = langSelect ? langSelect.value : "vi";

            // [MỚI] Gom dữ liệu theo đúng cấu trúc User Model
            const newSettings = {
                username: username,
                avatar: avatar,
                settings: {
                    theme: theme,
                    language: language,
                    notifications: {
                        emailOnInvite: notifInvite ? notifInvite.checked : true,
                        soundEnabled: notifSound ? notifSound.checked : true,
                        toastEnabled: notifToast ? notifToast.checked : true,
                        
                        // Cấu trúc mới cho Deadline Reminder
                        deadlineReminder: {
                            enabled: deadlineToggle ? deadlineToggle.checked : true,
                            daysBefore: deadlineDays ? parseInt(deadlineDays.value) : 1,
                            hoursBefore: deadlineHours ? parseInt(deadlineHours.value) : 2
                        }
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

                    if (newSettings.settings.theme === 'dark') {
                        document.documentElement.setAttribute('data-theme', 'dark');
                        localStorage.setItem('theme', 'dark');
                    } else {
                        document.documentElement.removeAttribute('data-theme');
                        localStorage.setItem('theme', 'light');
                    }

                    window.dispatchEvent(new CustomEvent('theme-change', { detail: theme }));
                    setLanguage(language);

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
                saveBtn.innerText = t("settings.save_btn");
                saveBtn.disabled = false;
            }
        });
    }

    // 6. ĐỔI MẬT KHẨU
    document.getElementById('btn-reset-pass')?.addEventListener('click', async () => {
        if (!emailInput || !emailInput.value) return;
        const btn = document.getElementById('btn-reset-pass');
        const originalText = btn.innerText;
        btn.innerText = "Processing..."; btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email: emailInput.value })
            });
            if(res.ok) toast.success("Đã gửi email đặt lại mật khẩu!");
            else toast.error("Có lỗi xảy ra");
        } catch(e) { toast.error("Lỗi kết nối"); }
        finally { btn.innerText = originalText; btn.disabled = false; }
    });
});