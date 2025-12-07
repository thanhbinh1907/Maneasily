import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';
import '../../css/components/modal.css';
import '../../css/components/profile-modal.css';

export function initProfileModal() {
    // 1. KIỂM TRA VÀ TỰ ĐỘNG CHÈN HTML (Nếu chưa có)
    if (!document.getElementById('profile-modal')) {
        const modalHTML = `
        <div id="profile-modal" class="modal-overlay">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2>Hồ sơ cá nhân</h2>
                    <button class="close-modal" id="close-profile-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="profile-avatar-section">
                        <img id="profile-preview-img" src="" alt="Avatar">
                        <p id="profile-email-display"></p>
                    </div>
                    <div class="form-group">
                        <label for="edit-username">Tên hiển thị (Username)</label>
                        <input type="text" id="edit-username" placeholder="Nhập tên mới...">
                    </div>
                    <div class="form-group">
                        <label for="edit-avatar">Link Avatar (URL)</label>
                        <input type="text" id="edit-avatar" placeholder="https://example.com/avatar.jpg">
                        <small>Mẹo: Dán link ảnh từ Google, Facebook hoặc Gravatar.</small>
                    </div>

                    <div class="private-mode-container">
                        <div class="private-label-group">
                            <span style="font-weight: 600; color: #44546f;">Yêu cầu phê duyệt</span>
                            <div class="tooltip-wrapper">
                                <i class="fa-regular fa-circle-question help-icon"></i>
                                <span class="tooltip-text">Khi bật: Bạn sẽ KHÔNG bị tự động thêm vào dự án. Sẽ có lời mời gửi đến Email và Thông báo để bạn xác nhận.</span>
                            </div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="private-mode-toggle">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-cancel" id="btn-cancel-profile">Hủy</button>
                    <button class="btn-modal btn-submit" id="btn-save-profile">Lưu thay đổi</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. LOGIC XỬ LÝ
    const profileLink = document.querySelector('a[href="/src/pages/profile.html"]'); // Nút kích hoạt trên Header
    const profileModal = document.getElementById('profile-modal');
    
    // Nếu trang hiện tại không có nút Profile trên header thì không chạy tiếp
    if (!profileLink) return;

    const closeBtn = document.getElementById('close-profile-modal');
    const cancelBtn = document.getElementById('btn-cancel-profile');
    const saveBtn = document.getElementById('btn-save-profile');
    const usernameInput = document.getElementById('edit-username');
    const avatarInput = document.getElementById('edit-avatar');
    const emailDisplay = document.getElementById('profile-email-display');
    const previewImg = document.getElementById('profile-preview-img');
    const privateToggle = document.getElementById('private-mode-toggle');

    const closeModal = () => profileModal.style.display = 'none';

    // Mở Modal
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
        if (!currentUser) return toast.error("Vui lòng đăng nhập lại");

        usernameInput.value = currentUser.username;
        avatarInput.value = currentUser.avatar;
        emailDisplay.textContent = currentUser.email;
        previewImg.src = currentUser.avatar || "https://www.gravatar.com/avatar/default?d=mp";
        
        // [CẬP NHẬT] Load trạng thái từ settings.privacy.requireInvite
        // Mặc định là false (Tắt - Tự động vào) nếu chưa có setting
        const privacySettings = currentUser.settings?.privacy || {};
        if (privateToggle) {
            privateToggle.checked = privacySettings.requireInvite ?? false;
        }

        document.getElementById('user-dropdown-menu')?.classList.remove('show');
        profileModal.style.display = 'flex';
    });

    // Các nút đóng
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeModal();
    });

    // Preview ảnh realtime
    avatarInput.addEventListener('input', () => {
        if(avatarInput.value.trim()) previewImg.src = avatarInput.value.trim();
    });
    previewImg.addEventListener('error', () => {
        previewImg.src = "https://www.gravatar.com/avatar/default?d=mp";
    });

    // Lưu thay đổi
    saveBtn.addEventListener('click', async () => {
        const newUsername = usernameInput.value.trim();
        const newAvatar = avatarInput.value.trim();
        
        // [CẬP NHẬT] Lấy giá trị toggle
        const isRequireInvite = privateToggle.checked; 

        if (!newUsername) return toast.error("Tên người dùng không được để trống");

        saveBtn.innerText = "Đang lưu...";
        saveBtn.disabled = true;

        try {
            // Lấy lại user hiện tại từ localStorage để merge setting (tránh mất các setting khác như theme, notif...)
            const currentUser = JSON.parse(localStorage.getItem('maneasily_user')) || {};
            const currentSettings = currentUser.settings || {};

            // Tạo object settings mới, giữ lại các giá trị cũ và chỉ ghi đè privacy.requireInvite
            const newSettings = {
                ...currentSettings, // Giữ theme, language, notifications...
                privacy: {
                    ...(currentSettings.privacy || {}), // Giữ searchable...
                    requireInvite: isRequireInvite // Cập nhật cái này
                }
            };

            const res = await fetch(`${API_BASE_URL}/users/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token')
                },
                body: JSON.stringify({ 
                    username: newUsername, 
                    avatar: newAvatar,
                    settings: newSettings // Gửi toàn bộ cấu trúc settings đã merge
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Cập nhật hồ sơ thành công!");
                
                // Lưu lại user mới vào localStorage
                localStorage.setItem('maneasily_user', JSON.stringify(data.user));
                
                // Cập nhật Header ngay lập tức
                const navAvatar = document.getElementById('nav-user-avatar');
                const navName = document.getElementById('nav-user-name');
                if (navAvatar) navAvatar.src = data.user.avatar;
                if (navName) navName.textContent = data.user.username;

                profileModal.style.display = 'none';
            } else {
                toast.error(data.err || "Cập nhật thất bại");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi kết nối server");
        } finally {
            saveBtn.innerText = "Lưu thay đổi";
            saveBtn.disabled = false;
        }
    });
}