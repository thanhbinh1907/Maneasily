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

    document.getElementById('detail-start-time')?.addEventListener('change', () => handleUpdate('startTime'));
    document.getElementById('detail-deadline')?.addEventListener('change', () => handleUpdate('deadline'));
    
    // [SỬA] Nút Lưu Nhãn sẽ gọi hàm update 'tag' (hàm này đã được sửa để lưu cả màu)
    document.getElementById('btn-save-tag')?.addEventListener('click', () => handleUpdate('tag'));
    
    // --- COLOR LOGIC (ĐÃ SỬA) ---
    const colorRadios = document.querySelectorAll('input[name="detailColor"]');
    const colorPicker = document.getElementById('detail-custom-color');

    // [FIX] Bỏ dòng này để không auto-save khi click radio
    // colorRadios.forEach(r => r.addEventListener('change', () => handleUpdate('color')));

    if (colorPicker) {
        colorPicker.addEventListener('input', () => {
            // Khi chỉnh màu ở picker thì bỏ chọn các radio (chỉ visual)
            colorRadios.forEach(r => r.checked = false);
        });
        // [FIX] Bỏ dòng này để không auto-save khi đổi màu picker
        // colorPicker.addEventListener('change', () => handleUpdate('color'));
    }

    // 1.4. Hành động Thêm/Comment
    document.getElementById('btn-add-subtask')?.addEventListener('click', handleAddSubtask);
    document.getElementById('btn-post-comment')?.addEventListener('click', handlePostComment);

    // 1.5. Xóa Task Chính
    document.getElementById('btn-delete-task-detail')?.addEventListener('click', () => {
        if(!canEditTask) return toast.error("Bạn không có quyền xóa task này.");
        
        showConfirm("Bạn có chắc chắn muốn xóa vĩnh viễn công việc này?", async () => {
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
    document.getElementById('file-breadcrumb')?.addEventListener('click', () => navigateFolder(null, 'Gốc')); 
    
    // Đóng các menu khi click ra ngoài
    window.addEventListener('click', () => { 
        const dd = document.getElementById('add-member-dropdown');
        if(dd) dd.style.display = 'none'; 
        document.querySelectorAll('.subtask-dropdown').forEach(el => el.style.display = 'none');
    });
}

// --- 2. OPEN MODAL ---
export async function openTaskDetail(taskId, isAdmin, members = []) {
    const modal = document.getElementById('task-detail-modal');
    if (modal) modal.style.display = 'flex';
    
    canEditTask = isAdmin;
    allProjectMembers = members;
    
    document.getElementById('detail-title').value = "Đang tải...";
    document.getElementById('btn-save-desc').style.display = 'none';
    
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

// --- 3. REFRESH UI ---
function refreshUI() {
    // [LOGIC MỚI] Kiểm tra chưa đến giờ bắt đầu
    const isNotStarted = currentTask.startTime && new Date() < new Date(currentTask.startTime);

    TaskView.renderInfo(currentTask);
    TaskView.renderMembers(currentTask.members, canEditTask);
    
    // [CẬP NHẬT] Truyền thêm isNotStarted vào view
    TaskView.renderSubtasks(currentTask.works, canEditTask, isOverdue, isNotStarted);
    
    TaskView.renderComments(currentTask.comments);
    TaskView.toggleEditMode(canEditTask);

    // ... (Phần logic comment giữ nguyên) ...
    const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
    const isMember = currentTask.members.some(m => m._id === currentUser._id);
    const commentInput = document.getElementById('comment-input');
    
    if (commentInput) {
        const commentContainer = commentInput.parentElement; 
        if (canEditTask || isMember) {
            commentContainer.style.display = 'block';
            document.getElementById('my-comment-avatar').style.display = 'block';
        } else {
            commentContainer.style.display = 'none';
            document.getElementById('my-comment-avatar').style.display = 'none';
        }
    }
    loadFileManager();
}

// --- 4. CÁC HÀM XỬ LÝ CẬP NHẬT ---
async function handleUpdate(field) {
    if (!canEditTask) return;
    let body = {};
    
    if (field === 'title') body.title = document.getElementById('detail-title').value;
    else if (field === 'dec') body.dec = document.getElementById('detail-desc').value;
    else if (field === 'startTime') body.startTime = document.getElementById('detail-start-time').value;
    else if (field === 'deadline') body.deadline = document.getElementById('detail-deadline').value;
    
    // [FIX QUAN TRỌNG] Khi bấm lưu tag, lấy luôn cả giá trị màu
    else if (field === 'tag') {
        body.tag = document.getElementById('detail-tag-input').value;
        
        // Lấy màu từ radio hoặc picker
        const radio = document.querySelector('input[name="detailColor"]:checked');
        const picker = document.getElementById('detail-custom-color');
        
        // Ưu tiên radio, nếu không có radio nào được chọn thì lấy picker, mặc định fallback là xanh
        body.color = radio ? radio.value : (picker ? picker.value : '#00c2e0');
    }

    const data = await TaskAPI.update(currentTask._id, body);
    if (data.task) {
        currentTask = data.task;
        isOverdue = formatTimeRemaining(currentTask.deadline).isOverdue;
        
        if (field === 'tag') toast.success("Đã lưu Nhãn & Màu sắc");
        else toast.success("Đã lưu");
        
        TaskView.updateBoardCard(currentTask, isOverdue);
        refreshUI();
    }
}

// --- 1. Hàm handleAddSubtask (Thêm công việc con) ---
async function handleAddSubtask() {
    const input = document.getElementById('new-subtask-input');
    if (!input.value.trim()) return;
    const data = await TaskAPI.addSubtask(input.value.trim(), currentTask._id);
    if (data.work) {
        input.value = "";
        currentTask.works.push(data.work);
        
        refreshUI(); // Cập nhật giao diện Modal
        
        // [MỚI] Cập nhật ngay lập tức thẻ ngoài Board (Viền xanh/đỏ)
        TaskView.updateBoardCard(currentTask, isOverdue);
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

// ... (Phần 5: GLOBAL EXPORTS - Giữ nguyên không đổi) ...
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

function renderSubtaskManagerUI() {
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

window.toggleSubtaskMember = async (workId, memberId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    if (isOverdue) return toast.error("Task đã quá hạn!");

    if (await TaskAPI.toggleMemberSubtask(workId, memberId)) {
        const data = await TaskAPI.getDetail(currentTask._id);
        currentTask = data.task;
        refreshUI();
        currentSubtaskWork = currentTask.works.find(w => w._id === workId);
        if (document.getElementById('subtask-member-modal').style.display === 'flex') {
            renderSubtaskManagerUI();
            toast.success("Cập nhật thành công");
        }
    } else {
        toast.error("Lỗi cập nhật");
    }
};

// --- 2. Hàm window.toggleSubtask ---
window.toggleSubtask = async (workId) => {
    // 1. Kiểm tra quá hạn
    if (isOverdue) return toast.error("Đã quá hạn!");

    // 2. [LOGIC MỚI] Kiểm tra chưa đến giờ bắt đầu
    if (currentTask.startTime && new Date() < new Date(currentTask.startTime)) {
        return toast.error("Chưa đến thời gian bắt đầu!");
    }

    const w = currentTask.works.find(x => x._id === workId);
    if (!w) return;

    const oldState = w.isDone;
    w.isDone = !w.isDone; // Đổi trạng thái client
    
    refreshUI(); 
    TaskView.updateBoardCard(currentTask, isOverdue);

    try {
        const success = await TaskAPI.toggleSubtask(workId);
        if (!success) throw new Error("Fail");
    } catch (err) {
        w.isDone = oldState;
        refreshUI();
        TaskView.updateBoardCard(currentTask, isOverdue);
        toast.error("Lỗi kết nối!");
    }
};

// --- 3. Hàm window.deleteSubtask (Xóa công việc con) ---
window.deleteSubtask = async (workId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền xóa.");
    
    showConfirm("Xóa công việc con này?", async () => {
        if (await TaskAPI.deleteSubtask(workId)) {
            // Xóa khỏi danh sách hiện tại
            currentTask.works = currentTask.works.filter(w => w._id !== workId);
            
            refreshUI(); // Cập nhật giao diện Modal
            
            // [MỚI] Cập nhật ngay lập tức thẻ ngoài Board (Viền xanh/đỏ)
            // (Phòng trường hợp xóa xong thì tất cả các việc còn lại đều đã Done -> Xanh)
            TaskView.updateBoardCard(currentTask, isOverdue);
            
            toast.success("Đã xóa");
        } else toast.error("Lỗi xóa");
    });
};
window.addMemberToTask = async (memberId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    if (isOverdue) return toast.error("Task đã quá hạn!");

    const newIds = [...currentTask.members.map(m => m._id), memberId];
    const data = await TaskAPI.update(currentTask._id, { members: newIds });
    if (data.task) {
        currentTask = data.task;
        toast.success("Đã thêm thành viên");
        TaskView.updateBoardCard(currentTask, isOverdue);
        refreshUI();
        document.getElementById('add-member-dropdown').style.display = 'none';
    } else {
        toast.error(data.err || "Lỗi cập nhật");
    }
};

window.removeMemberFromTask = async (memberId) => {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    
    if (await TaskAPI.removeMember(currentTask._id, memberId)) {
        currentTask.members = currentTask.members.filter(m => m._id !== memberId);
        if (currentTask.works) {
            currentTask.works.forEach(work => {
                if (work.members) work.members = work.members.filter(m => m._id !== memberId);
            });
        }
        TaskView.updateBoardCard(currentTask, isOverdue);
        refreshUI();
        toast.success("Đã xóa thành viên");
    }
};

window.handleSubtaskDrop = async (e, workId) => {
    e.preventDefault();
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    const memberId = e.dataTransfer.getData("memberId_subtask");
    if (memberId && await TaskAPI.toggleMemberSubtask(workId, memberId)) {
        const data = await TaskAPI.getDetail(currentTask._id);
        currentTask = data.task;
        refreshUI();
        toast.success("Đã cập nhật người làm");
    }
};

window.toggleSubtaskMenu = (workId) => {
    const menu = document.getElementById(`subtask-menu-${workId}`);
    document.querySelectorAll('.subtask-dropdown').forEach(el => {
        if(el !== menu) el.style.display = 'none';
    });
    if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
};

window.enableEditComment = (commentId) => {
    document.getElementById(`comment-view-${commentId}`).style.display = 'none';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'block';
};

window.cancelEditComment = (commentId) => {
    document.getElementById(`comment-view-${commentId}`).style.display = 'block';
    document.getElementById(`comment-edit-${commentId}`).style.display = 'none';
};

window.saveEditComment = async (commentId) => {
    const newContent = document.getElementById(`input-edit-${commentId}`).value.trim();
    if (!newContent) return toast.error("Nội dung trống");

    try {
        const data = await TaskAPI.updateComment(commentId, newContent);
        if (data.comment) {
            const idx = currentTask.comments.findIndex(c => c._id === commentId);
            if (idx !== -1) currentTask.comments[idx] = data.comment;
            TaskView.renderComments(currentTask.comments);
            toast.success("Đã sửa bình luận");
        } else {
            toast.error(data.err || "Lỗi");
        }
    } catch (err) { toast.error("Lỗi kết nối"); }
};

window.deleteComment = async (commentId) => {
    showConfirm("Bạn muốn xóa bình luận này?", async () => {
        try {
            const success = await TaskAPI.deleteComment(commentId);
            if (success) {
                currentTask.comments = currentTask.comments.filter(c => c._id !== commentId);
                TaskView.renderComments(currentTask.comments);
                toast.success("Đã xóa bình luận");
            } else {
                toast.error("Lỗi xóa");
            }
        } catch (err) { toast.error("Lỗi kết nối"); }
    });
};

// --- FILE MANAGER ---
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

    folders.forEach(f => {
        const el = document.createElement('div');
        el.className = 'file-item';
        el.style.cssText = 'border: 1px solid #dfe1e6; border-radius: 6px; padding: 10px; text-align: center; cursor: pointer; position: relative; background: #fff;';
        el.innerHTML = `
            <i class="fa-solid fa-folder" style="font-size: 2rem; color: #ffab00; display: block; margin-bottom: 5px;"></i>
            <div style="font-size: 0.8rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</div>
            <i class="fa-solid fa-xmark btn-delete-file" style="position: absolute; top: 2px; right: 5px; font-size: 0.8rem; color: #d93025; display: none;"></i>
        `;
        el.addEventListener('click', (e) => {
            if(!e.target.classList.contains('btn-delete-file')) navigateFolder(f._id, f.name);
        });
        el.querySelector('.btn-delete-file').addEventListener('click', () => deleteItem('folder', f._id));
        el.addEventListener('mouseenter', () => el.querySelector('.btn-delete-file').style.display = 'block');
        el.addEventListener('mouseleave', () => el.querySelector('.btn-delete-file').style.display = 'none');
        container.appendChild(el);
    });

    files.forEach(f => {
        const el = document.createElement('div');
        el.className = 'file-item';
        el.style.cssText = 'border: 1px solid #dfe1e6; border-radius: 6px; padding: 10px; text-align: center; cursor: pointer; position: relative; background: #fff;';
        let icon = 'fa-file'; let color = '#6b778c';
        if (f.mimetype.includes('image')) { icon = 'fa-file-image'; color = '#a6c5f7'; }
        else if (f.mimetype.includes('pdf')) { icon = 'fa-file-pdf'; color = '#d93025'; }
        
        const fileUrl = `http://localhost:5000/${f.path.replace(/\\/g, '/')}`;
        el.innerHTML = `
            <i class="fa-solid ${icon}" style="font-size: 2rem; color: ${color}; display: block; margin-bottom: 5px;"></i>
            <div style="font-size: 0.8rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${f.originalName}">${f.originalName}</div>
            <i class="fa-solid fa-xmark btn-delete-file" style="position: absolute; top: 2px; right: 5px; font-size: 0.8rem; color: #d93025; display: none;"></i>
        `;
        el.addEventListener('click', (e) => {
            if(!e.target.classList.contains('btn-delete-file')) window.open(fileUrl, '_blank');
        });
        el.querySelector('.btn-delete-file').addEventListener('click', () => deleteItem('file', f._id));
        el.addEventListener('mouseenter', () => el.querySelector('.btn-delete-file').style.display = 'block');
        el.addEventListener('mouseleave', () => el.querySelector('.btn-delete-file').style.display = 'none');
        container.appendChild(el);
    });
}

function renderBreadcrumb() {
    const bc = document.getElementById('file-breadcrumb');
    bc.innerHTML = '';
    currentFolderPath.forEach((item, index) => {
        const span = document.createElement('span');
        span.innerHTML = (index === 0) ? `<i class="fa-solid fa-house"></i>` : item.name;
        span.style.cursor = 'pointer'; span.style.padding = '0 4px';
        if (index === currentFolderPath.length - 1) {
            span.style.fontWeight = 'bold'; span.style.color = '#000';
        } else {
            span.style.color = '#0079bf'; span.innerHTML += ' <span style="color:#666">/</span> ';
        }
        span.addEventListener('click', () => {
            currentFolderPath = currentFolderPath.slice(0, index + 1);
            currentFolderId = item.id;
            loadFileManager();
        });
        bc.appendChild(span);
    });
}

function navigateFolder(folderId, folderName) {
    currentFolderId = folderId;
    if (folderId === null) currentFolderPath = [{ id: null, name: 'Gốc' }];
    else currentFolderPath.push({ id: folderId, name: folderName });
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
    } catch (err) { toast.error("Lỗi tải lên"); }
    e.target.value = ''; 
}

async function deleteItem(type, id) {
    if (!canEditTask) return toast.error("Bạn không có quyền.");
    showConfirm(`Xóa ${type === 'file' ? 'tệp' : 'thư mục'} này?`, async () => {
        await TaskAPI.deleteItem(type, id);
        loadFileManager();
        toast.success("Đã xóa");
    });
}