import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';
import { io } from "socket.io-client"; 

import dingSound from '../../assets/sounds/ding.mp3';

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

    // --- 1. KẾT NỐI SOCKET.IO ---
    const socket = io("http://localhost:5000"); 
    const user = JSON.parse(localStorage.getItem('maneasily_user'));

    if (user) {
        socket.emit("join", user._id);

        socket.on("newNotification", (newNotif) => {
            console.log("🔔 Đã nhận thông báo mới:", newNotif); // [DEBUG] Thêm log để kiểm tra

            // a. Hiện Toast
            toast.info(`🔔 ${newNotif.content}`);

            // b. Phát âm thanh
            const soundEnabled = user.settings?.notifications?.soundEnabled ?? true;
            if (soundEnabled) {
                // [SỬA ĐOẠN NÀY] Thay URL bằng biến dingSound
                const audio = new Audio(dingSound);
                audio.volume = 0.5;
                audio.play().catch(() => {}); // Bỏ qua lỗi nếu trình duyệt chặn tự phát
            }

            // c. Cập nhật Badge (Số đỏ)
            // [CẬP NHẬT] Logic cập nhật badge an toàn hơn
            let currentCount = 0;
            if (badge.style.display !== 'none' && badge.textContent) {
                currentCount = parseInt(badge.textContent);
            }
            updateBadge(currentCount + 1);

            // d. [QUAN TRỌNG] Thêm vào danh sách ngay lập tức (Real-time update UI)
            // Nếu danh sách đang trống (có dòng "Không có thông báo"), xóa dòng đó đi
            const emptyMsg = listContainer.querySelector('p'); 
            if (emptyMsg && emptyMsg.textContent.includes("Không có thông báo")) {
                emptyMsg.remove();
            }

            // Tạo HTML và chèn lên đầu danh sách
            const itemHTML = createNotifItemHTML(newNotif);
            listContainer.insertAdjacentHTML('afterbegin', itemHTML);
        });
    }

    // --- 2. XỬ LÝ SỰ KIỆN UI ---
    
    // Toggle Dropdown khi bấm chuông
    bellBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Đóng các menu khác nếu đang mở
        document.getElementById('user-dropdown-menu')?.classList.remove('show');
        
        const isClosed = !dropdown.classList.contains('show');
        dropdown.classList.toggle('show');

        // Nếu mở ra thì reset và tải lại trang 1
        if (isClosed) {
            resetAndLoad();
        }
    });

    // Đóng khi click ra ngoài
    window.addEventListener('click', (e) => {
        if (!bellBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown?.classList.remove('show');
        }
    });

    // Cuộn xuống để tải thêm (Infinite Scroll)
    listContainer.addEventListener('scroll', () => {
        if (listContainer.scrollTop + listContainer.clientHeight >= listContainer.scrollHeight - 20) {
            if (!isLoading && hasMore) {
                currentPage++;
                fetchNotifications(currentPage);
            }
        }
    });

    // Nút "Đánh dấu tất cả là đã đọc"
    markAllBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Authorization': localStorage.getItem('maneasily_token') }
            });
            // Reset giao diện về đã đọc hết
            document.querySelectorAll('.noti-item.unread').forEach(item => {
                item.classList.remove('unread');
                item.querySelector('.noti-dot')?.remove();
            });
            updateBadge(0);
            toast.success("Đã đánh dấu tất cả là đã đọc");
        } catch(err) { console.error(err); }
    });


    // --- 3. HÀM XỬ LÝ DỮ LIỆU ---

    function resetAndLoad() {
        currentPage = 1;
        hasMore = true;
        listContainer.innerHTML = ''; 
        fetchNotifications(1);
    }

    async function fetchNotifications(page) {
        if (isLoading || !hasMore) return;
        isLoading = true;
        
        // Hiện spinner loading nếu không phải trang 1
        let spinner = null;
        if (page > 1) {
            spinner = document.createElement('div');
            spinner.className = 'noti-loading';
            spinner.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
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
                    listContainer.innerHTML = '<p class="empty-msg" style="padding:20px; text-align:center; color:#888; font-size:0.9rem;">Không có thông báo nào.</p>';
                    updateBadge(0);
                } else {
                    const html = data.notifications.map(n => createNotifItemHTML(n)).join('');
                    listContainer.insertAdjacentHTML('beforeend', html);
                }
                
                // Chỉ cập nhật badge khi load trang 1 để đảm bảo số chính xác nhất
                if (page === 1) updateBadge(data.unreadCount);
                
                hasMore = data.hasMore;
            }
        } catch (err) { 
            console.error("Lỗi tải thông báo", err);
            listContainer.innerHTML = '<p style="padding:10px; color:red; text-align:center;">Lỗi kết nối!</p>';
        } finally {
            isLoading = false;
        }
    }

    // --- 4. RENDER HTML ---
    function createNotifItemHTML(n) {
        const timeDisplay = new Date(n.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const senderName = n.sender ? n.sender.username : 'Hệ thống';
        const senderAvatar = n.sender ? n.sender.avatar : 'https://www.gravatar.com/avatar/default?d=mp';

        let actionHTML = '';
        let clickAttribute = `onclick="window.handleNotiClick('${n._id}', '${n.link}')"`;

        // TRƯỜNG HỢP 1: LỜI MỜI MỚI (Hiện 2 nút)
        if (n.type === 'invite') {
            clickAttribute = ''; 
            actionHTML = `
            <div class="invite-actions" id="actions-${n._id}" style="margin-top: 8px; display: flex; gap: 8px;">
                <button class="btn-xs btn-primary" onclick="window.respondInvite(event, '${n.link}', 'accepted', '${n._id}')">
                    Đồng ý
                </button>
                <button class="btn-xs btn-danger-outline" onclick="window.respondInvite(event, '${n.link}', 'rejected', '${n._id}')">
                    Từ chối
                </button>
            </div>`;
        } 
        // TRƯỜNG HỢP 2: ĐÃ ĐỒNG Ý (Hiện chữ xanh)
        else if (n.type === 'invite_accepted') {
            clickAttribute = '';
            actionHTML = `
            <div style="margin-top: 5px; font-size: 0.85rem; color: #2e8b57; font-weight: 600;">
                <i class="fa-solid fa-check"></i> Đã đồng ý tham gia
            </div>`;
        }
        // TRƯỜNG HỢP 3: ĐÃ TỪ CHỐI (Hiện chữ đỏ)
        else if (n.type === 'invite_rejected') {
            clickAttribute = '';
            actionHTML = `
            <div style="margin-top: 5px; font-size: 0.85rem; color: #d93025; font-weight: 600;">
                <i class="fa-solid fa-xmark"></i> Đã từ chối lời mời
            </div>`;
        }

        return `
            <div id="notif-${n._id}" class="noti-item ${n.isRead ? '' : 'unread'}" ${clickAttribute}>
                <img src="${senderAvatar}" class="noti-avatar">
                <div class="noti-content">
                    <p><strong>${senderName}</strong> ${n.content}</p>
                    ${actionHTML}
                    <span class="noti-time">${timeDisplay}</span>
                </div>
                ${!n.isRead ? '<div class="noti-dot"></div>' : ''}
                <div class="noti-delete" title="Xóa" onclick="window.deleteOneNoti(event, '${n._id}')">
                    <i class="fa-solid fa-times"></i>
                </div>
            </div>
        `;
    }

    // --- 5. WINDOW GLOBAL FUNCTIONS (Xử lý sự kiện từ HTML string) ---

    // Xử lý Phản hồi Lời mời
    window.respondInvite = async (e, inviteId, status, notifId) => {
        e.stopPropagation(); 
        
        const container = document.getElementById(`actions-${notifId}`);
        if(container) container.innerHTML = '<span style="font-size:0.8rem; color:#666;">Đang xử lý...</span>';

        try {
            const res = await fetch(`${API_BASE_URL}/users/invitation/respond`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token') 
                },
                body: JSON.stringify({ invitationId: inviteId, status: status }) 
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(status === 'accepted' ? "Đã tham gia dự án!" : "Đã từ chối lời mời.");
                
                // Cập nhật giao diện: Thay nút bằng chữ
                if(container) {
                    const color = status === 'accepted' ? '#2e8b57' : '#d93025';
                    const text = status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối';
                    container.innerHTML = `<span style="color:${color}; font-weight:600; font-size:0.85rem;"><i class="fa-solid fa-check"></i> ${text}</span>`;
                }

                // Đánh dấu đã đọc
                markReadUI(notifId);

                // Nếu chấp nhận -> Reload trang để thấy dự án mới
                if (status === 'accepted') {
                    setTimeout(() => window.location.reload(), 1000);
                }
            } else {
                toast.error(data.err || "Lỗi xử lý");
                if(container) container.innerHTML = '<span style="color:red; font-size:0.8rem;">Lỗi. Thử lại sau.</span>';
            }
        } catch(err) { 
            console.error(err); 
            toast.error("Lỗi kết nối");
        }
    };

    // Xử lý Click thông báo thường
    window.handleNotiClick = async (id, link) => {
        // Gọi API đánh dấu đã đọc
        fetch(`${API_BASE_URL}/notification/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        }).catch(console.error);
        
        // Cập nhật UI ngay lập tức
        markReadUI(id);

        // Chuyển trang (nếu có link hợp lệ)
        if (link && link !== '#' && link !== 'undefined' && !link.includes('undefined')) {
            window.location.href = link;
        }
    };

    // Xóa 1 thông báo
    window.deleteOneNoti = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await fetch(`${API_BASE_URL}/notification/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': localStorage.getItem('maneasily_token') }
            });
            if (res.ok) {
                const item = document.getElementById(`notif-${id}`);
                if(item) {
                    // Nếu đang unread thì giảm badge
                    if(item.classList.contains('unread')) {
                        const current = parseInt(badge.textContent || 0);
                        updateBadge(Math.max(0, current - 1));
                    }
                    item.remove();
                }
            }
        } catch(err) { console.error(err); }
    };

    // Helper: Cập nhật UI đã đọc
    function markReadUI(id) {
        const item = document.getElementById(`notif-${id}`);
        if (item && item.classList.contains('unread')) {
            item.classList.remove('unread');
            const dot = item.querySelector('.noti-dot');
            if(dot) dot.remove();
            
            const current = parseInt(badge.textContent || 0);
            updateBadge(Math.max(0, current - 1));
        }
    }

    function updateBadge(count) {
        if (count > 0) {
            badge.style.display = 'flex'; // Dùng flex để căn giữa số
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }
}