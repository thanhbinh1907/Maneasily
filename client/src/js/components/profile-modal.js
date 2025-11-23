import { API_BASE_URL } from '../config.js';
// --- IMPORT CSS TẠI ĐÂY ---
import '../../css/components/modal.css';         // Style chung cho modal
import '../../css/components/profile-modal.css'; // Style riêng cho profile
// ---------------------------

export function initProfileModal() {
    const profileLink = document.querySelector('a[href="/src/pages/profile.html"]');
    const profileModal = document.getElementById('profile-modal');
    
    // Nếu không tìm thấy element thì dừng (tránh lỗi ở các trang không có modal)
    if (!profileLink || !profileModal) return;

    const closeBtn = document.getElementById('close-profile-modal');
    const cancelBtn = document.getElementById('btn-cancel-profile');
    const saveBtn = document.getElementById('btn-save-profile');
    
    const usernameInput = document.getElementById('edit-username');
    const avatarInput = document.getElementById('edit-avatar');
    const emailDisplay = document.getElementById('profile-email-display');
    const previewImg = document.getElementById('profile-preview-img');

    // 1. Mở Modal
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
        if (!currentUser) return;

        usernameInput.value = currentUser.username;
        avatarInput.value = currentUser.avatar;
        emailDisplay.textContent = currentUser.email;
        previewImg.src = currentUser.avatar || "https://www.gravatar.com/avatar/default?d=mp";
        
        // Ẩn menu dropdown nếu đang mở
        const dropdown = document.getElementById('user-dropdown-menu');
        if(dropdown) dropdown.classList.remove('show');
        
        profileModal.style.display = 'flex';
    });

    // 2. Đóng Modal
    const closeProfile = () => profileModal.style.display = 'none';
    closeBtn.addEventListener('click', closeProfile);
    cancelBtn.addEventListener('click', closeProfile);
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeProfile();
    });

    // 3. Preview ảnh
    avatarInput.addEventListener('input', () => {
        if(avatarInput.value.trim()) previewImg.src = avatarInput.value.trim();
    });
    previewImg.addEventListener('error', () => {
        previewImg.src = "https://www.gravatar.com/avatar/default?d=mp";
    });

    // 4. Lưu thay đổi
    saveBtn.addEventListener('click', async () => {
        const newUsername = usernameInput.value.trim();
        const newAvatar = avatarInput.value.trim();

        if (!newUsername) {
            alert("Tên người dùng không được để trống");
            return;
        }

        const originalText = saveBtn.innerText;
        saveBtn.innerText = "Đang lưu...";
        saveBtn.disabled = true;

        try {
            const res = await fetch('http://localhost:5000/api/users/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token')
                },
                body: JSON.stringify({ username: newUsername, avatar: newAvatar })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Cập nhật hồ sơ thành công!");
                
                // Update LocalStorage
                localStorage.setItem('maneasily_user', JSON.stringify(data.user));
                
                // Update Header UI ngay lập tức
                const navAvatar = document.getElementById('nav-user-avatar');
                const navName = document.getElementById('nav-user-name');
                if (navAvatar) navAvatar.src = data.user.avatar;
                if (navName) navName.textContent = data.user.username;

                closeProfile();
            } else {
                alert(data.err);
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server.");
        } finally {
            saveBtn.innerText = originalText;
            saveBtn.disabled = false;
        }
    });
}