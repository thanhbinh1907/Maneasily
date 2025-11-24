import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';
import '../../css/components/share-modal.css';
import { showConfirm } from '../utils/confirm.js';

// Hàm helper để render 1 dòng user
const createUserItemHTML = (user, boardData, currentUser) => {
    // 1. Lấy ID của Owner và danh sách Admin
    const ownerId = boardData.userOwner._id || boardData.userOwner;
    const adminIds = boardData.admins ? boardData.admins.map(a => a._id || a) : [];

    // 2. Xác định vai trò của User đang được render (user)
    const isTargetOwner = user._id === ownerId;
    const isTargetManager = adminIds.includes(user._id);

    // 3. Xác định vai trò của CHÍNH BẠN (currentUser)
    const amIOwner = currentUser._id === ownerId;
    const amIManager = adminIds.includes(currentUser._id);
    const isMe = user._id === currentUser._id;

    // Label vai trò
    let roleBadge = `<span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; background: #eee; color: #666;">Thành viên</span>`;
    if (isTargetOwner) roleBadge = `<span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; background: #ff7f32; color: white;">Chủ dự án</span>`;
    else if (isTargetManager) roleBadge = `<span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; background: #0079bf; color: white;">Quản lý</span>`;

    // Nút bấm (Action Buttons)
    let buttonsHTML = '';

    // Không được thao tác với chính mình
    if (!isMe) {
        // Nút KICK (Mời ra khỏi dự án)
        // Owner kick được tất cả (trừ chính mình). Manager chỉ kick được Member thường.
        let canKick = false;
        if (amIOwner) canKick = true;
        if (amIManager && !isTargetManager && !isTargetOwner) canKick = true;

        if (canKick) {
            buttonsHTML += `<button class="btn-icon-action btn-kick" data-id="${user._id}" title="Mời ra khỏi dự án"><i class="fa-solid fa-user-xmark" style="color: #d93025;"></i></button>`;
        }

        // Nút THĂNG/GIÁNG CHỨC (Chỉ Owner mới có quyền)
        if (amIOwner) {
            if (isTargetManager) {
                // Đang là Manager -> Nút Giáng chức
                buttonsHTML += `<button class="btn-icon-action btn-demote" data-id="${user._id}" title="Hủy quyền quản lý"><i class="fa-solid fa-user-minus" style="color: #ff9f1a;"></i></button>`;
            } else if (!isTargetOwner) {
                // Đang là Member -> Nút Thăng chức
                buttonsHTML += `<button class="btn-icon-action btn-promote" data-id="${user._id}" title="Cấp quyền quản lý"><i class="fa-solid fa-user-shield" style="color: #2e8b57;"></i></button>`;
            }
        }
    }

    const fallbackAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

    return `
        <div class="user-result-item" style="cursor: default; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${user.avatar}" onerror="this.src='${fallbackAvatar}'" class="result-avatar">
                <div class="result-info">
                    <div>${user.username} ${isMe ? '(Bạn)' : ''}</div>
                    <div style="font-size: 0.8rem; color: #666;">${user.email}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                ${roleBadge}
                <div class="action-buttons" style="display: flex; gap: 5px;">${buttonsHTML}</div>
            </div>
        </div>
    `;
};

// --- HÀM MỚI: Render danh sách thành viên hiện tại ---
export function renderProjectMembers(members, boardData) {
    const container = document.getElementById('project-members-list');
    const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
    if (!container || !currentUser) return;

    container.innerHTML = members.map(user => createUserItemHTML(user, boardData, currentUser)).join('');

    // Gắn sự kiện cho các nút
    container.querySelectorAll('.btn-promote').forEach(btn => {
        btn.addEventListener('click', () => handleRoleAction('promote', btn.dataset.id, boardData._id));
    });
    container.querySelectorAll('.btn-demote').forEach(btn => {
        btn.addEventListener('click', () => handleRoleAction('demote', btn.dataset.id, boardData._id));
    });
    container.querySelectorAll('.btn-kick').forEach(btn => {
        btn.addEventListener('click', () => handleRoleAction('remove-member', btn.dataset.id, boardData._id));
    });
}

async function handleRoleAction(action, memberId, projectId) {
    // Action: 'promote', 'demote', 'remove-member'
    let msg = "Bạn chắc chắn muốn thực hiện hành động này?";
    if (action === 'promote') msg = "Cấp quyền quản lý cho thành viên này?";
    if (action === 'demote') msg = "Hủy quyền quản lý của thành viên này?";
    if (action === 'remove-member') msg = "Mời thành viên này ra khỏi dự án?";

    showConfirm(msg, async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/project/${action}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token')
                },
                body: JSON.stringify({ projectId, memberId })
            });
            
            if (res.ok) {
                toast.success("Cập nhật thành công!");
                setTimeout(() => location.reload(), 500); // Reload để cập nhật lại danh sách và quyền
            } else {
                const d = await res.json();
                toast.error(d.err || "Lỗi");
            }
        } catch (e) { toast.error("Lỗi server"); }
    });
}

export function initShareFeature(projectId) {
    const shareBtn = document.getElementById('btn-manage-members');
    const modal = document.getElementById('share-modal');
    
    if (!shareBtn || !modal) return;

    const closeBtn = document.getElementById('close-share-modal');
    const searchInput = document.getElementById('user-search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    const linkInput = document.getElementById('share-link-input'); 
    const btnCopyLink = document.getElementById('btn-copy-link');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Mở Modal
    shareBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        if(searchInput) { searchInput.value = ''; }
        if(dropdown) dropdown.style.display = 'none';
    });

    // Đóng Modal
    const closeModal = () => modal.style.display = 'none';
    closeBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Chuyển Tab
    tabBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active'); c.style.display = 'none';
            });
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if(targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }

            // Nếu click tab Link -> Gọi API lấy link
            if (targetId === 'tab-link') {
                if(linkInput && linkInput.value.includes('...')) { // Chỉ gọi nếu chưa có link
                    linkInput.value = "Đang tạo link...";
                    try {
                        const res = await fetch(`${API_BASE_URL}/project/${projectId}/invite`, {
                            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                        });
                        const data = await res.json();
                        if (res.ok) linkInput.value = data.inviteUrl;
                        else {
                            linkInput.value = "Lỗi lấy link";
                            toast.error(data.err);
                        }
                    } catch (err) {
                        console.error(err);
                        linkInput.value = "Lỗi kết nối";
                    }
                }
            }
        });
    });

    // Copy Link
    btnCopyLink?.addEventListener('click', () => {
        if(linkInput && linkInput.value.startsWith('http')) {
            navigator.clipboard.writeText(linkInput.value);
            toast.success("Đã sao chép liên kết!");
        }
    });

    // Tìm kiếm User (Debounce)
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            clearTimeout(debounceTimer);
            if (keyword.length < 2) { dropdown.style.display = 'none'; return; }

            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/users/search?q=${keyword}`, {
                        headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                    });
                    const data = await res.json();
                    
                    // Render kết quả tìm kiếm
                    dropdown.innerHTML = '';
                    dropdown.style.display = 'block';
                    
                    if (data.users.length === 0) {
                        dropdown.innerHTML = '<div style="padding:10px; text-align:center; color:#666;">Không tìm thấy.</div>';
                    } else {
                        data.users.forEach(user => {
                            const item = document.createElement('div');
                            item.className = 'user-result-item';
                            // Khi click vào kết quả tìm kiếm -> Thêm user
                            item.addEventListener('click', () => addUser(user, projectId));
                            
                            item.innerHTML = `
                                <img src="${user.avatar || 'https://www.gravatar.com/avatar/default?d=mp'}" class="result-avatar">
                                <div class="result-info">
                                    <div>${user.username}</div>
                                    <div style="font-size:0.8rem">${user.email}</div>
                                </div>
                            `;
                            dropdown.appendChild(item);
                        });
                    }
                } catch (err) { console.error(err); }
            }, 300);
        });
    }

    async function addUser(userToAdd, projectId) {
        showConfirm(`Thêm ${userToAdd.username} vào dự án này?`, async () => {
        try {
             const res = await fetch(`${API_BASE_URL}/users/add-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
                body: JSON.stringify({ projectId, userId: userToAdd._id })
            });
            if(res.ok) {
                toast.success(`Đã thêm ${userToAdd.username}!`);
                dropdown.style.display = 'none';
                searchInput.value = '';
                // Reload lại trang để cập nhật danh sách
                setTimeout(() => location.reload(), 1000);
            } else {
                const d = await res.json();
                toast.error(d.err || "Lỗi thêm thành viên");
            }
        } catch(e) { toast.error("Lỗi server"); }
     
    });
    }
}