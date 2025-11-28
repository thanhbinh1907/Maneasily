import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';
// Import socket.io-client. 
// Lưu ý: Đảm bảo bạn đã cài đặt: npm install socket.io-client
import { io } from "socket.io-client"; 

export function initNotifications() {
    const bellBtn = document.getElementById('noti-bell-btn');
    const dropdown = document.getElementById('noti-dropdown-content');
    const badge = document.getElementById('noti-badge');
    const listContainer = document.getElementById('noti-list-container');
    const markAllBtn = document.getElementById('btn-mark-all-read');

    // State quản lý phân trang
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;

    // --- 0. KẾT NỐI SOCKET.IO (REAL-TIME) ---
    const user = JSON.parse(localStorage.getItem('maneasily_user'));
    // Lưu ý: Port là 5000 (server), không phải client
    const socket = io("http://localhost:5000"); 

    if (user) {
        // Gửi sự kiện 'join' để server map userId với socketId
        socket.emit("join", user._id);

        // Lắng nghe sự kiện có thông báo mới
        socket.on("newNotification", (newNotif) => {
            // 1. Hiện Toast
            toast.info(`🔔 ${newNotif.content}`);

            // 2. Cập nhật Badge
            const currentCount = parseInt(badge.textContent || '0');
            updateBadge(currentCount + 1);

            // 3. Thêm vào đầu danh sách
            // Nếu đang hiện "Không có thông báo" thì xóa đi
            const emptyMsg = listContainer.querySelector('p');
            if (emptyMsg && emptyMsg.textContent.includes('Không có thông báo')) {
                emptyMsg.remove();
            }

            // Tạo HTML và chèn lên đầu
            const itemHTML = createNotifItemHTML(newNotif);
            listContainer.insertAdjacentHTML('afterbegin', itemHTML);
        });
    }

    // --- 1. Toggle Dropdown ---
    bellBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('user-dropdown-menu')?.classList.remove('show');
        const isClosed = !dropdown.classList.contains('show');
        
        dropdown.classList.toggle('show');

        // Nếu mở ra thì reset và load trang 1
        if (isClosed) {
            resetAndLoad();
        }
    });

    // Đóng khi click ra ngoài
    window.addEventListener('click', (e) => {
        if (!bellBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown?.classList.remove('show');
            closeAllItemMenus();
        }
    });

    // --- 2. Hàm Reset & Load ---
    function resetAndLoad() {
        currentPage = 1;
        hasMore = true;
        listContainer.innerHTML = ''; // Xóa cũ
        fetchNotifications(1);
    }

    // --- 3. Hàm Fetch Data ---
    async function fetchNotifications(page) {
        if (isLoading || !hasMore) return;
        isLoading = true;
        
        // Hiện spinner loading nếu không phải trang 1
        let spinner = null;
        if (page > 1) {
            spinner = document.createElement('div');
            spinner.className = 'noti-loading';
            spinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải thêm...';
            listContainer.appendChild(spinner);
            listContainer.scrollTop = listContainer.scrollHeight;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/notifications?page=${page}`, {
                headers: { 'Authorization': localStorage.getItem('maneasily_token') }
            });
            const data = await res.json();
            
            if (spinner) spinner.remove();

            if (data.notifications) {
                if (page === 1 && data.notifications.length === 0) {
                    listContainer.innerHTML = '<p style="padding:15px; text-align:center; color:#666; font-size:0.9rem;">Không có thông báo nào.</p>';
                } else {
                    appendNotifications(data.notifications);
                }
                
                updateBadge(data.unreadCount);
                hasMore = data.hasMore;
            }
        } catch (err) { 
            console.error("Lỗi tải thông báo", err);
        } finally {
            isLoading = false;
        }
    }

    // --- 4. Render & Append ---
    function appendNotifications(notifs) {
        // Dùng insertAdjacentHTML thay vì appendChild để dùng chuỗi HTML từ helper
        const html = notifs.map(n => createNotifItemHTML(n)).join('');
        listContainer.insertAdjacentHTML('beforeend', html);
    }

    // --- Helper tạo HTML cho 1 item (Dùng chung cho Fetch và Socket) ---
    function createNotifItemHTML(n) {
        const timeDisplay = new Date(n.createdAt).toLocaleString();
        
        // 👇 LOGIC MỚI: Nút bấm cho lời mời
        let actionButtons = '';
        if (n.type === 'invite') {
            // n.link chứa inviteId (do ta đã lưu ở backend)
            actionButtons = `
            <div class="invite-actions" style="margin-top: 8px; display: flex; gap: 8px;">
                <button onclick="window.respondInvite(event, '${n.link}', 'accept', '${n._id}')" 
                        style="padding: 4px 10px; background: #2e8b57; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    Đồng ý
                </button>
                <button onclick="window.respondInvite(event, '${n.link}', 'decline', '${n._id}')" 
                        style="padding: 4px 10px; background: #dfe1e6; color: #333; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    Từ chối
                </button>
            </div>`;
        }

        return `
            <div class="noti-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}">
                <img src="${n.sender?.avatar || 'https://www.gravatar.com/avatar/default?d=mp'}" class="noti-avatar">
                <div class="noti-content">
                    <div>
                        <span style="font-weight:600">${n.sender?.username}</span> ${n.content}
                    </div>
                    ${actionButtons} <span class="noti-time">${timeDisplay}</span>
                </div>
                ${!n.isRead ? '<div class="noti-dot"></div>' : ''}
                </div>
        `;
    }

    // 👇 HÀM XỬ LÝ SỰ KIỆN CLICK NÚT
    window.respondInvite = async (e, inviteId, action, notifId) => {
        e.stopPropagation(); // Chặn sự kiện click vào item cha
        try {
            const res = await fetch(`${API_BASE_URL}/users/invitation/response`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token') 
                },
                body: JSON.stringify({ inviteId, action })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.msg);
                // Đánh dấu thông báo đã đọc/xử lý
                await fetch(`${API_BASE_URL}/notification/${notifId}/read`, {
                    method: 'PATCH',
                    headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                });
                
                // Reload lại list thông báo hoặc xóa nút
                const item = document.querySelector(`.noti-item[data-id="${notifId}"]`);
                if(item) {
                    item.querySelector('.invite-actions').innerHTML = `<span style="font-size:0.8rem; color:#2e8b57; font-style:italic;">Đã phản hồi (${action})</span>`;
                    item.classList.remove('unread');
                }
                
                // Nếu chấp nhận thì reload trang để thấy dự án mới
                if (action === 'accept') setTimeout(() => location.reload(), 1000);
            } else {
                toast.error(data.err);
            }
        } catch(err) { toast.error("Lỗi kết nối"); }
    };

    // --- 5. Infinite Scroll Logic ---
    listContainer.addEventListener('scroll', () => {
        if (listContainer.scrollTop + listContainer.clientHeight >= listContainer.scrollHeight - 20) {
            if (!isLoading && hasMore) {
                currentPage++;
                fetchNotifications(currentPage);
            }
        }
    });

    // --- 6. Helper Functions ---
    function updateBadge(count) {
        if (count > 0) {
            badge.style.display = 'block';
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }

    function closeAllItemMenus() {
        document.querySelectorAll('.noti-item-menu').forEach(el => el.classList.remove('show'));
    }

    // --- 7. Global Actions ---

    window.toggleNotiItemMenu = (e, id) => {
        e.stopPropagation();
        closeAllItemMenus();
        const menu = document.getElementById(`noti-menu-${id}`);
        if(menu) menu.classList.add('show');
    };

    window.handleNotiClick = async (id, link) => {
        await fetch(`${API_BASE_URL}/notification/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        
        if (link && link !== '#' && link !== 'undefined') {
            window.location.href = link;
        } else {
            const item = document.querySelector(`.noti-item[data-id="${id}"]`);
            if(item) {
                item.classList.remove('unread');
                const dot = item.querySelector('.noti-dot');
                if(dot) dot.remove();
            }
            const currentBadge = parseInt(badge.textContent || 0);
            updateBadge(Math.max(0, currentBadge - 1));
        }
    };

    window.markOneRead = async (e, id) => {
        e.stopPropagation();
        closeAllItemMenus();
        try {
            await fetch(`${API_BASE_URL}/notification/${id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': localStorage.getItem('maneasily_token') }
            });
            const item = document.querySelector(`.noti-item[data-id="${id}"]`);
            if(item && item.classList.contains('unread')) {
                item.classList.remove('unread');
                const dot = item.querySelector('.noti-dot');
                if(dot) dot.remove();
                const currentBadge = parseInt(badge.textContent || 0);
                updateBadge(Math.max(0, currentBadge - 1));
            }
            toast.success("Đã đánh dấu đã đọc");
        } catch(err) { toast.error("Lỗi kết nối"); }
    };

    window.deleteOneNoti = async (e, id) => {
        e.stopPropagation();
        closeAllItemMenus();
        try {
            const res = await fetch(`${API_BASE_URL}/notification/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': localStorage.getItem('maneasily_token') }
            });
            if (res.ok) {
                const item = document.querySelector(`.noti-item[data-id="${id}"]`);
                if(item) {
                    item.remove();
                    if(item.classList.contains('unread')) {
                        const currentBadge = parseInt(badge.textContent || 0);
                        updateBadge(Math.max(0, currentBadge - 1));
                    }
                }
                toast.success("Đã xóa thông báo");
            } else {
                toast.error("Không thể xóa");
            }
        } catch(err) { toast.error("Lỗi kết nối"); }
    };

    markAllBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await fetch(`${API_BASE_URL}/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        resetAndLoad(); 
    });

    fetchNotifications(1);
}