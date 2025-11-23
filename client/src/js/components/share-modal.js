// File: client/src/js/components/share-modal.js
import { API_BASE_URL } from '../config.js';

export function initShareFeature(projectId) {
    const shareBtn = document.getElementById('btn-manage-members');
    const modal = document.getElementById('share-modal');
    const closeBtn = document.getElementById('close-share-modal');
    const searchInput = document.getElementById('user-search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    const linkInput = document.getElementById('share-link-input'); 
    const btnCopyLink = document.getElementById('btn-copy-link');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Nếu không có nút share (ví dụ user không phải admin) thì dừng
    if (!shareBtn) return;

    // 1. Mở/Đóng Modal
    shareBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        if(searchInput) { searchInput.value = ''; searchInput.focus(); }
        if(dropdown) dropdown.style.display = 'none';
    });
    
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // 2. Xử lý Tabs & Lấy Link
    tabBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Reset active states
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });

            // Set new active
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if(targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }

            // Fetch Link nếu cần
            if (targetId === 'tab-link') {
                if(linkInput) linkInput.value = "Đang tạo link...";
                const token = localStorage.getItem('maneasily_token');
                try {
                    const res = await fetch(`${API_BASE_URL}/project/${projectId}/invite`, {
                        headers: { 'Authorization': token }
                    });
                    const data = await res.json();
                    if (linkInput && res.ok) linkInput.value = data.inviteUrl;
                } catch (err) {
                    console.error(err);
                    if(linkInput) linkInput.value = "Lỗi kết nối";
                }
            }
        });
    });

    // 3. Nút Copy
    if(btnCopyLink) {
        btnCopyLink.addEventListener('click', () => {
            if(linkInput && linkInput.value.startsWith('http')) {
                navigator.clipboard.writeText(linkInput.value);
                const originalText = btnCopyLink.innerText;
                btnCopyLink.innerText = "Copied!";
                setTimeout(() => btnCopyLink.innerText = originalText, 2000);
            }
        });
    }

    // 4. Tìm kiếm & Thêm User (Rút gọn logic search để code ngắn hơn)
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            clearTimeout(debounceTimer);
            if (keyword.length < 2) { dropdown.style.display = 'none'; return; }

            debounceTimer = setTimeout(async () => {
                const token = localStorage.getItem('maneasily_token');
                try {
                    const res = await fetch(`${API_BASE_URL}/users/search?q=${keyword}`, {
                        headers: { 'Authorization': token }
                    });
                    const data = await res.json();
                    renderSearchResults(data.users, projectId);
                } catch (err) { console.error(err); }
            }, 300);
        });
    }

    function renderSearchResults(users, projectId) {
        dropdown.innerHTML = '';
        dropdown.style.display = 'block';
        
        if (!users || users.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px; text-align:center; color:#666;">Không tìm thấy.</div>';
            return;
        }

        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-result-item';
            // ... (giữ nguyên HTML innerHTML render user của bạn) ...
            item.innerHTML = `
                <img src="${user.avatar}" class="result-avatar">
                <div class="result-info"><div>${user.username}</div><div style="font-size:0.8rem">${user.email}</div></div>
            `;
            item.addEventListener('click', () => addUser(user, projectId));
            dropdown.appendChild(item);
        });
    }

    async function addUser(user, projectId) {
        if (!confirm(`Thêm ${user.username} vào dự án?`)) return;
        const token = localStorage.getItem('maneasily_token');
        // Gọi API add member...
        try {
             const res = await fetch(`${API_BASE_URL}/users/add-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ projectId, userId: user._id })
            });
            if(res.ok) {
                alert("Thêm thành công!");
                dropdown.style.display = 'none';
                searchInput.value = '';
                // Tùy chọn: Reload page để cập nhật list member
                location.reload();
            } else {
                const d = await res.json();
                alert(d.err);
            }
        } catch(e) { alert("Lỗi server"); }
    }
}