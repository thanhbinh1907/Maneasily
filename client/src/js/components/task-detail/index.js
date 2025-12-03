import { toast } from '../../utils/toast.js';
import { showConfirm } from '../../utils/confirm.js';
import '../../../css/components/task-detail.css'; 

import { TaskAPI } from './api.js';
import { TaskView, formatTimeRemaining } from './view.js';

let currentTask = null;
let canEditTask = false;
let isOverdue = false;
let allProjectMembers = [];
let currentSubtaskWork = null; 
let currentFolderId = null; // null = Gốc
let currentFolderPath = [{ id: null, name: 'Gốc' }];

// --- 1. KHỞI TẠO SỰ KIỆN (INIT) ---
export function initTaskDetailModal() {
    // 1.1. Init Main Modal
    const modal = document.getElementById('task-detail-modal');
    const closeBtn = document.getElementById('close-detail-modal');
    const closeModal = () => { if(modal) modal.style.display = 'none'; };
    
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    // 1.2. Init Subtask Manager Modal
    const subModal = document.getElementById('subtask-member-modal');
    const closeSubBtn = document.getElementById('close-subtask-modal');
    const closeSubModal = () => { if(subModal) subModal.style.display = 'none'; };
    
    closeSubBtn?.addEventListener('click', closeSubModal);
    subModal?.addEventListener('click', (e) => { if(e.target === subModal) closeSubModal(); });

    // Tab chuyển đổi trong Subtask Modal
    const tabBtns = document.querySelectorAll('.subtask-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.subtask-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // 1.3. Sự kiện Update Task (Auto-save)
    document.getElementById('detail-title')?.addEventListener('blur', () => {
        if (currentTask && document.getElementById('detail-title').value.trim() !== currentTask.title) handleUpdate('title');
    });
    document.getElementById('detail-title')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') document.getElementById('detail-title').blur(); });

    document.getElementById('btn-save-desc')?.addEventListener('click', () => {
        handleUpdate('dec');
        document.getElementById('btn-save-desc').style.display = 'none';
    });
    document.getElementById('detail-desc')?.addEventListener('focus', () => { 
        if(canEditTask) document.getElementById('btn-save-desc').style.display = 'inline-block'; 
    });

    // --- [MỚI] Sự kiện cho Start Time ---
    document.getElementById('detail-start-time')?.addEventListener('change', () => handleUpdate('startTime'));

    document.getElementById('detail-deadline')?.addEventListener('change', () => handleUpdate('deadline'));
    document.getElementById('btn-save-tag')?.addEventListener('click', () => handleUpdate('tag'));
    
    // Color Events
    document.querySelectorAll('input[name="detailColor"]').forEach(r => r.addEventListener('change', () => handleUpdate('color')));
    document.getElementById('detail-custom-color')?.addEventListener('change', () => handleUpdate('color'));

    // 1.4. Hành động Thêm/Comment
    document.getElementById('btn-add-subtask')?.addEventListener('click', handleAddSubtask);
    document.getElementById('btn-post-comment')?.addEventListener('click', handlePostComment);

    // 1.5. Xóa Task Chính
    document.getElementById('btn-delete-task-detail')?.addEventListener('click', () => {
        if(!canEditTask) return toast.error("Bạn không có quyền xóa task này.");
        showConfirm("Xóa vĩnh viễn công việc này?", async () => {
            if (await TaskAPI.delete(currentTask._id)) {
                const card = document.querySelector(`.task-card[data-task-id="${currentTask._id}"]`);
                if(card) card.remove();
                toast.success("Đã xóa task");
                closeModal();
            } else toast.error("Lỗi xóa task");
        });
    });

    // 1.6. Menu Thêm thành viên Task Chính
    document.getElementById('btn-add-member-detail')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!canEditTask) return toast.error("Bạn không có quyền thêm thành viên.");
        const dd = document.getElementById('add-member-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        if(dd.style.display === 'block') TaskView.renderAvailableMembers(currentTask.members, allProjectMembers);
    });

    // 1.7. File Manager Events
    document.getElementById('btn-create-folder')?.addEventListener('click', handleCreateFolder);
    document.getElementById('file-upload-input')?.addEventListener('change', handleUploadFile);
    document.getElementById('file-breadcrumb')?.addEventListener('click', () => navigateFolder(null, 'Gốc')); // Click về gốc
    
    // Đóng các menu khi click ra ngoài
    window.addEventListener('click', () => { 
        const dd = document.getElementById('add-member-dropdown');
        if(dd) dd.style.display = 'none'; 
        document.querySelectorAll('.subtask-dropdown').forEach(el => el.style.display = 'none');
    });
    
}

// --- 2. OPEN MODAL (Entry Point) ---
export async function openTaskDetail(taskId, isAdmin, members = []) {
    const modal = document.getElementById('task-detail-modal');
    if (modal) modal.style.display = 'flex';
    
    canEditTask = isAdmin;
    allProjectMembers = members;
    
    document.getElementById('detail-title').value = "Đang tải...";
    document.getElementById('btn-save-desc').style.display = 'none';
    
    // Ẩn nút xóa task nếu không phải Admin
    const btnDelete = document.getElementById('btn-delete-task-detail');
    if(btnDelete) btnDelete.style.display = canEditTask ? '' : 'none';
    
    const data = await TaskAPI.getDetail(taskId);
    if (data.task) {
        currentTask = data.task;
        isOverdue = formatTimeRemaining(currentTask.deadline).isOverdue;
        refreshUI();
    } else {
        toast.error("Lỗi tải task");
        modal.style.display = 'none';
    }
}

// --- 3. LOGIC CẬP NHẬT GIAO DIỆN  ---
function refreshUI() {
    TaskView.renderInfo(currentTask);
    TaskView.renderMembers(currentTask.members, canEditTask);
    TaskView.renderSubtasks(currentTask.works, canEditTask, isOverdue);
    TaskView.renderComments(currentTask.comments);
    TaskView.toggleEditMode(canEditTask);

    // --- [MỚI] Xử lý ẩn/hiện ô Comment ---
    const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
    // Kiểm tra xem mình có phải thành viên của task này không
    const isMember = currentTask.members.some(m => m._id === currentUser._id);
    
    // Lấy phần tử bao quanh ô input và nút comment (dựa vào HTML hiện tại)
    const commentInput = document.getElementById('comment-input');
    const commentBtn = document.getElementById('btn-post-comment');
    
    if (commentInput && commentBtn) {
        const commentContainer = commentInput.parentElement; // Thẻ div bao quanh
        
        // Nếu là Admin hoặc là Member thì được comment, ngược lại thì ẩn
        if (canEditTask || isMember) {
            commentContainer.style.display = 'block';
            document.getElementById('my-comment-avatar').style.display = 'block';
        } else {
            // Ẩn input, nút và avatar của mình
            commentContainer.style.display = 'none';
            document.getElementById('my-comment-avatar').style.display = 'none';
            
            // (Tùy chọn) Hiển thị thông báo thay thế
            if (!document.getElementById('comment-locked-msg')) {
                const msg = document.createElement('div');
                msg.id = 'comment-locked-msg';
                msg.style.cssText = 'color: #666; font-style: italic; padding: 10px; background: #f4f5f7; border-radius: 4px; font-size: 0.9rem;';
                msg.innerText = "Chỉ thành viên tham gia mới được bình luận.";
                commentContainer.parentElement.appendChild(msg); // Thêm vào cha của container
            }
        }
    }
    loadFileManager();
}
// --- 4. XỬ LÝ CẬP NHẬT TASK CHÍNH ---
async function handleUpdate(field) {
    if (!canEditTask) return;
    let body = {};
    if (field === 'title') body.title = document.getElementById('detail-title').value;
    else if (field === 'dec') body.dec = document.getElementById('detail-desc').value;
    else if (field === 'startTime') body.startTime = document.getElementById('detail-start-time').value; // <--- Cập nhật startTime
    else if (field === 'deadline') body.deadline = document.getElementById('detail-deadline').value;
    else if (field === 'tag') body.tag = document.getElementById('detail-tag-input').value;
    else if (field === 'color') {
        const radio = document.querySelector('input[name="detailColor"]:checked');
        const picker = document.getElementById('detail-custom-color');
        body.color = radio ? radio.value : picker.value;
    }

    const data = await TaskAPI.update(currentTask._id, body);
    if (data.task) {
        currentTask = data.task;
        isOverdue = formatTimeRemaining(currentTask.deadline).isOverdue;
        toast.success("Đã lưu");
        TaskView.updateBoardCard(currentTask, isOverdue);
        refreshUI();
    }
}

async function handleAddSubtask() {
    const input = document.getElementById('new-subtask-input');
    if (!input.value.trim()) return;
    const data = await TaskAPI.addSubtask(input.value.trim(), currentTask._id);
    if (data.work) {
        input.value = "";
        currentTask.works.push(data.work);
        refreshUI();
    }
}

async function handlePostComment() {
    const input = document.getElementById('comment-input');
    if (!input.value.trim()) return;
    const data = await TaskAPI.addComment(input.value.trim(), currentTask._id);
    if (data.comment) {
        input.value = "";
        currentTask.comments.push(data.comment);
        refreshUI();
    }
}

// ============================================================
// --- 5. GLOBAL EXPORTS (CÁC HÀM GỌI TỪ HTML ONCLICK) ---
// ============================================================

window.openSubtaskManager = (workId) => {
    document.querySelectorAll('.subtask-dropdown').forEach(el => el.style.display = 'none');
    currentSubtaskWork = currentTask.works.find(w => w._id === workId);
    if (!currentSubtaskWork) return;

    const modal = document.getElementById('subtask-member-modal');
    if(modal) {
        modal.style.display = 'flex';
        renderSubtaskManagerUI();
    }
};

// Render nội dung trong Modal Quản lý Subtask
function renderSubtaskManagerUI() {
    // Tab 1: Danh sách hiện tại (Có nút Kick cho Admin)
    const listMembers = document.getElementById('sub-members');
    if (!currentSubtaskWork.members || currentSubtaskWork.members.length === 0) {
        listMembers.innerHTML = '<div style="color:#999; font-style:italic; padding:10px;">Chưa có ai làm việc này.</div>';
    } else {
        listMembers.innerHTML = currentSubtaskWork.members.map(m => `
            <div class="sub-member-row">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${m.avatar}" style="width:32px; height:32px; border-radius:50%;">
                    <span>${m.username}</span>
                </div>
                ${canEditTask ? `
                <button onclick="window.toggleSubtaskMember('${currentSubtaskWork._id}', '${m._id}')" 
                        style="border:1px solid #d93025; color:#d93025; background:white; padding:4px 8px; border-radius:4px; cursor:pointer;">
                    Kick
                </button>` : ''}
            </div>
        `).join('');
    }

    // Tab 2: Thêm thành viên (Chỉ hiện nếu là Admin)
    const listAdd = document.getElementById('sub-add');
    if (!canEditTask) {
        listAdd.innerHTML = '<div style="color:#999; padding:10px;">Bạn không có quyền thêm thành viên.</div>';
    } else {
        const currentIds = currentSubtaskWork.members.map(m => m._id);
        const available = allProjectMembers.filter(m => !currentIds.includes(m._id));

        if (available.length === 0) {
            listAdd.innerHTML = '<div style="color:#999; padding:10px;">Tất cả thành viên dự án đã được thêm.</div>';
        } else {
            listAdd.innerHTML = available.map(m => `
                <div class="sub-member-row" onclick="window.toggleSubtaskMember('${currentSubtaskWork._id}', '${m._id}')" style="cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${m.avatar}" style="width:32px; height:32px; border-radius:50%;">
                        <span>${m.username}</span>
                    </div>
                    <i class="fa-solid fa-plus" style="color:#0079bf;"></i>
                </div>
            `).join('');
        }
    }
}

// API Toggle Member Subtask
window.toggleSubtaskMember = async (workId, memberId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    
    // [MỚI] Chặn ngay tại client nếu đã quá hạn
    if (isOverdue) {
        return toast.error("Task đã quá hạn! Không thể thay đổi thành viên subtask.");
    }

    if (await TaskAPI.toggleMemberSubtask(workId, memberId)) {
        // Reload data
        const data = await TaskAPI.getDetail(currentTask._id);
        currentTask = data.task;
        refreshUI();
        
        // Re-render modal con nếu đang mở
        currentSubtaskWork = currentTask.works.find(w => w._id === workId);
        if (document.getElementById('subtask-member-modal').style.display === 'flex') {
            renderSubtaskManagerUI();
            toast.success("Cập nhật thành công");
        }
    } else {
        toast.error("Lỗi cập nhật hoặc task đã quá hạn");
    }
};

// B. Các thao tác khác
window.toggleSubtask = async (workId) => {
    // Member cũng được tick done nếu chưa quá hạn
    if (isOverdue) return toast.error("Đã quá hạn! Không thể thay đổi.");
    
    if (await TaskAPI.toggleSubtask(workId)) {
        const w = currentTask.works.find(x => x._id === workId);
        if (w) w.isDone = !w.isDone;
        refreshUI();
    }
};

window.deleteSubtask = async (workId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền xóa.");
    showConfirm("Xóa công việc này?", async () => {
        if (await TaskAPI.deleteSubtask(workId)) {
            currentTask.works = currentTask.works.filter(w => w._id !== workId);
            refreshUI();
            toast.success("Đã xóa");
        } else toast.error("Lỗi xóa");
    });
};

window.addMemberToTask = async (memberId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    
    if (isOverdue) {
        return toast.error("Task đã quá hạn! Không thể thêm thành viên.");
    }

    const newIds = [...currentTask.members.map(m => m._id), memberId];
    const data = await TaskAPI.update(currentTask._id, { members: newIds });
    
    if (data.task) {
        currentTask = data.task;
        toast.success("Đã thêm thành viên");
        TaskView.updateBoardCard(currentTask, isOverdue);
        refreshUI();
        document.getElementById('add-member-dropdown').style.display = 'none';
    } else {
        // Hiển thị lỗi từ server trả về (nếu lọt qua check ở client)
        toast.error(data.err || "Lỗi cập nhật");
    }
};
window.removeMemberFromTask = async (memberId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    
    // Gọi API xóa ở Server
    if (await TaskAPI.removeMember(currentTask._id, memberId)) {
        
        // 1. Cập nhật danh sách thành viên của TASK CHÍNH (Local State)
        currentTask.members = currentTask.members.filter(m => m._id !== memberId);

        // 2. (MỚI) Cập nhật luôn danh sách thành viên trong SUBTASKS (Local State)
        // Duyệt qua tất cả các việc con (works) và xóa người này ra khỏi đó
        if (currentTask.works && currentTask.works.length > 0) {
            currentTask.works.forEach(work => {
                if (work.members) {
                    work.members = work.members.filter(m => m._id !== memberId);
                }
            });
        }

        // 3. Render lại giao diện ngay lập tức
        TaskView.updateBoardCard(currentTask, isOverdue);
        refreshUI(); // Hàm này sẽ vẽ lại Subtask list với dữ liệu mới đã lọc
        
        toast.success("Đã xóa thành viên");
    }
};

window.handleSubtaskDrop = async (e, workId) => {
    e.preventDefault();
    if (!canEditTask) return toast.error("Bạn không có quyền gán việc.");
    
    const memberId = e.dataTransfer.getData("memberId_subtask");
    if (memberId && await TaskAPI.toggleMemberSubtask(workId, memberId)) {
        const data = await TaskAPI.getDetail(currentTask._id);
        currentTask = data.task;
        refreshUI();
        toast.success("Đã cập nhật người làm");
    }
};

// Toggle menu 3 chấm (export ra global)
window.toggleSubtaskMenu = (workId) => {
    const menu = document.getElementById(`subtask-menu-${workId}`);
    // Đóng các menu khác trước
    document.querySelectorAll('.subtask-dropdown').forEach(el => {
        if(el !== menu) el.style.display = 'none';
    });
    // Toggle menu hiện tại
    if (menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
    }
};

// --- LOGIC FILE MANAGER ---

async function loadFileManager() {
    const container = document.getElementById('file-list-container');
    container.innerHTML = '<div style="font-size:0.8rem; color:#666;">Đang tải...</div>';

    const data = await TaskAPI.getFiles(currentTask._id, currentFolderId);
    renderFileList(data.folders, data.files);
    renderBreadcrumb();
}

function renderFileList(folders, files) {
    const container = document.getElementById('file-list-container');
    container.innerHTML = '';

    if (folders.length === 0 && files.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; font-size: 0.85rem; padding: 20px;">Thư mục trống</div>';
        return;
    }

    // 1. Render Folders
    folders.forEach(f => {
        const el = document.createElement('div');
        el.className = 'file-item';
        el.style.cssText = 'border: 1px solid #dfe1e6; border-radius: 6px; padding: 10px; text-align: center; cursor: pointer; position: relative; background: #fff;';
        el.innerHTML = `
            <i class="fa-solid fa-folder" style="font-size: 2rem; color: #ffab00; display: block; margin-bottom: 5px;"></i>
            <div style="font-size: 0.8rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</div>
            <i class="fa-solid fa-xmark btn-delete-file" style="position: absolute; top: 2px; right: 5px; font-size: 0.8rem; color: #d93025; display: none;"></i>
        `;
        
        // Click để vào folder
        el.addEventListener('click', (e) => {
            if(e.target.classList.contains('btn-delete-file')) return;
            navigateFolder(f._id, f.name);
        });

        // Hover để hiện nút xóa
        el.addEventListener('mouseenter', () => el.querySelector('.btn-delete-file').style.display = 'block');
        el.addEventListener('mouseleave', () => el.querySelector('.btn-delete-file').style.display = 'none');
        
        // Xóa folder
        el.querySelector('.btn-delete-file').addEventListener('click', () => deleteItem('folder', f._id));

        container.appendChild(el);
    });

    // 2. Render Files
    files.forEach(f => {
        const el = document.createElement('div');
        el.className = 'file-item';
        el.style.cssText = 'border: 1px solid #dfe1e6; border-radius: 6px; padding: 10px; text-align: center; cursor: pointer; position: relative; background: #fff;';
        
        // Icon tùy theo loại file
        let icon = 'fa-file';
        let color = '#6b778c';
        if (f.mimetype.includes('image')) { icon = 'fa-file-image'; color = '#a6c5f7'; }
        else if (f.mimetype.includes('pdf')) { icon = 'fa-file-pdf'; color = '#d93025'; }
        else if (f.mimetype.includes('word')) { icon = 'fa-file-word'; color = '#0079bf'; }

        // URL file
        const fileUrl = `http://localhost:5000/${f.path.replace(/\\/g, '/')}`;

        el.innerHTML = `
            <i class="fa-solid ${icon}" style="font-size: 2rem; color: ${color}; display: block; margin-bottom: 5px;"></i>
            <div style="font-size: 0.8rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.originalName}">${f.originalName}</div>
            <i class="fa-solid fa-xmark btn-delete-file" style="position: absolute; top: 2px; right: 5px; font-size: 0.8rem; color: #d93025; display: none;"></i>
        `;

        // Click để mở file
        el.addEventListener('click', (e) => {
            if(e.target.classList.contains('btn-delete-file')) return;
            window.open(fileUrl, '_blank');
        });

        el.addEventListener('mouseenter', () => el.querySelector('.btn-delete-file').style.display = 'block');
        el.addEventListener('mouseleave', () => el.querySelector('.btn-delete-file').style.display = 'none');
        
        el.querySelector('.btn-delete-file').addEventListener('click', () => deleteItem('file', f._id));

        container.appendChild(el);
    });
}

function renderBreadcrumb() {
    const bc = document.getElementById('file-breadcrumb');
    bc.innerHTML = '';
    
    currentFolderPath.forEach((item, index) => {
        const span = document.createElement('span');
        span.innerHTML = (index === 0) ? `<i class="fa-solid fa-house"></i>` : item.name;
        span.style.cursor = 'pointer';
        span.style.padding = '0 4px';
        
        if (index === currentFolderPath.length - 1) {
            span.style.fontWeight = 'bold';
            span.style.color = '#000';
        } else {
            span.style.color = '#0079bf';
            span.innerHTML += ' <span style="color:#666">/</span> ';
        }

        span.addEventListener('click', () => {
            // Quay lại folder này: cắt mảng path từ đầu đến index hiện tại
            currentFolderPath = currentFolderPath.slice(0, index + 1);
            currentFolderId = item.id;
            loadFileManager();
        });

        bc.appendChild(span);
    });
}

function navigateFolder(folderId, folderName) {
    currentFolderId = folderId;
    // Nếu về gốc
    if (folderId === null) {
        currentFolderPath = [{ id: null, name: 'Gốc' }];
    } else {
        currentFolderPath.push({ id: folderId, name: folderName });
    }
    loadFileManager();
}

async function handleCreateFolder() {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    const name = prompt("Nhập tên thư mục mới:");
    if (name) {
        await TaskAPI.createFolder(name, currentTask._id, currentFolderId);
        loadFileManager();
        toast.success("Đã tạo thư mục");
    }
}

async function handleUploadFile(e) {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    const file = e.target.files[0];
    if (!file) return;

    toast.info("Đang tải lên...");
    try {
        await TaskAPI.uploadFile(file, currentTask._id, currentFolderId);
        loadFileManager();
        toast.success("Tải lên thành công");
    } catch (err) {
        toast.error("Lỗi tải lên");
    }
    e.target.value = ''; // Reset input
}

async function deleteItem(type, id) {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    showConfirm(`Xóa ${type === 'file' ? 'tệp' : 'thư mục'} này?`, async () => {
        await TaskAPI.deleteItem(type, id);
        loadFileManager();
        toast.success("Đã xóa");
    });
}