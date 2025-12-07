import { toast } from '../../utils/toast.js';
import { showConfirm } from '../../utils/confirm.js'; 
import { t } from '../../utils/i18n.js';
import '../../../css/components/task-detail.css'; 

import { TaskAPI } from './api.js';
import { TaskView, formatTimeRemaining } from './view.js';
import { API_BASE_URL } from '../../config.js';

let currentTask = null;
let canEditTask = false;
let isOverdue = false;
let allProjectMembers = [];
let currentSubtaskWork = null; 
let currentFolderId = null; 
let currentFolderPath = [{ id: null, name: 'Root' }]; 

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
    
    document.getElementById('btn-save-tag')?.addEventListener('click', () => handleUpdate('tag'));
    
    const colorRadios = document.querySelectorAll('input[name="detailColor"]');
    const colorPicker = document.getElementById('detail-custom-color');

    if (colorPicker) {
        colorPicker.addEventListener('input', () => {
            colorRadios.forEach(r => r.checked = false);
        });
    }

    // 1.4. Hành động Thêm/Comment
    document.getElementById('btn-add-subtask')?.addEventListener('click', handleAddSubtask);
    document.getElementById('btn-post-comment')?.addEventListener('click', handlePostComment);

    // 1.5. Xóa Task Chính
    document.getElementById('btn-delete-task-detail')?.addEventListener('click', () => {
        if(!canEditTask) return toast.error(t('task.no_permission'));
        
        showConfirm(t('task.confirm_delete_permanent'), async () => {
            if (await TaskAPI.delete(currentTask._id)) {
                const card = document.querySelector(`.task-card[data-task-id="${currentTask._id}"]`);
                if(card) card.remove();
                toast.success(t('task.deleted_success'));
                document.getElementById('task-detail-modal').style.display = 'none';
            } else toast.error(t('common.error'));
        });
    });

    // 1.6. Menu Thêm thành viên Task Chính
    document.getElementById('btn-add-member-detail')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!canEditTask) return toast.error(t('task.no_permission'));
        const dd = document.getElementById('add-member-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        if(dd.style.display === 'block') TaskView.renderAvailableMembers(currentTask.members, allProjectMembers);
    });

    // 1.7. File Manager Events
    document.getElementById('btn-create-folder')?.addEventListener('click', handleCreateFolder);
    document.getElementById('file-breadcrumb')?.addEventListener('click', () => navigateFolder(null, t('task.files_root'))); 
    
    document.body.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'file-upload-input') {
            console.log("⚡ Đã bắt được sự kiện chọn file!"); 
            handleUploadFile(e);
        }
    });

    // --- [MỚI] INIT MODAL TẠO THƯ MỤC ---
    const folderModal = document.getElementById('create-folder-modal');
    const folderForm = document.getElementById('form-create-folder');
    const folderInput = document.getElementById('new-folder-name');
    const cancelFolderBtn = document.getElementById('cancel-create-folder');
    const closeFolderBtn = document.getElementById('close-folder-modal');

    const closeFolderModal = () => {
        if (folderModal) {
            folderModal.style.display = 'none';
            if (folderInput) folderInput.value = ''; 
        }
    };

    cancelFolderBtn?.addEventListener('click', closeFolderModal);
    closeFolderBtn?.addEventListener('click', closeFolderModal);

    folderForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = folderInput.value.trim();
        if (!name) return;

        try {
            const data = await TaskAPI.createFolder(name, currentTask._id, currentFolderId);
            if (data && data.folder) {
                loadFileManager();
                toast.success(t('file.created') || "Đã tạo thư mục.");
                closeFolderModal(); 
            } else {
                toast.error(t('file.folder_create_error') || "Lỗi tạo thư mục");
            }
        } catch (err) { 
            console.error(err);
            toast.error("Lỗi kết nối"); 
        }
    });

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

    currentFolderId = null;
    currentFolderPath = [{ id: null, name: t('task.files_root') }];   

    document.getElementById('detail-title').value = t('dash.loading');
    document.getElementById('btn-save-desc').style.display = 'none';
    
    const btnDelete = document.getElementById('btn-delete-task-detail');
    if(btnDelete) btnDelete.style.display = canEditTask ? '' : 'none';
    
    const data = await TaskAPI.getDetail(taskId);
    if (data.task) {
        currentTask = data.task;
        isOverdue = formatTimeRemaining(currentTask.deadline).isOverdue;
        refreshUI();
    } else {
        toast.error(t('task.error_load'));
        modal.style.display = 'none';
    }
}

// --- 3. REFRESH UI ---
function refreshUI() {
    const isNotStarted = currentTask.startTime && new Date() < new Date(currentTask.startTime);

    TaskView.renderInfo(currentTask);
    TaskView.renderMembers(currentTask.members, canEditTask);
    TaskView.renderSubtasks(currentTask.works, canEditTask, isOverdue, isNotStarted);
    TaskView.renderComments(currentTask.comments);
    TaskView.toggleEditMode(canEditTask);

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
    else if (field === 'tag') {
        body.tag = document.getElementById('detail-tag-input').value;
        const radio = document.querySelector('input[name="detailColor"]:checked');
        const picker = document.getElementById('detail-custom-color');
        body.color = radio ? radio.value : (picker ? picker.value : '#00c2e0');
    }

    const data = await TaskAPI.update(currentTask._id, body);
    if (data.task) {
        currentTask = data.task;
        isOverdue = formatTimeRemaining(currentTask.deadline).isOverdue;
        
        if (field === 'tag') toast.success(t('task.saved_tags'));
        else toast.success(t('task.saved'));
        
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
        listMembers.innerHTML = `<div style="color:#999; font-style:italic; padding:10px;">${t('subtask.no_assignee')}</div>`;
    } else {
        listMembers.innerHTML = currentSubtaskWork.members.map(m => `
            <div class="sub-member-row">
                ${canEditTask ? `
                <button onclick="window.toggleSubtaskMember('${currentSubtaskWork._id}', '${m._id}')">
                    ${t('subtask.kick')}
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
            listAdd.innerHTML = `<div style="color:#999; padding:10px;">${t('subtask.all_added')}</div>`;
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
    if (!canEditTask) return toast.error(t('task.no_permission'));
    if (isOverdue) return toast.error(t('task.msg_overdue'));

    if (await TaskAPI.toggleMemberSubtask(workId, memberId)) {
        const data = await TaskAPI.getDetail(currentTask._id);
        currentTask = data.task;
        refreshUI();
        currentSubtaskWork = currentTask.works.find(w => w._id === workId);
        if (document.getElementById('subtask-member-modal').style.display === 'flex') {
            renderSubtaskManagerUI();
            toast.success(t('task.msg_update_member_success'));
        }
    } else {
        toast.error("Lỗi cập nhật");
    }
};

window.toggleSubtask = async (workId) => {
    if (isOverdue) return toast.error(t('task.msg_overdue'));
    if (currentTask.startTime && new Date() < new Date(currentTask.startTime)) {
        return toast.error(t('task.msg_not_started'));
    }

    const w = currentTask.works.find(x => x._id === workId);
    if (!w) return;

    const oldState = w.isDone;
    w.isDone = !w.isDone; 
    
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

window.deleteSubtask = async (workId) => {
    if (!canEditTask) return toast.error(t('task.no_permission'));
    
    showConfirm(t('subtask.delete_confirm'), async () => {
        if (await TaskAPI.deleteSubtask(workId)) {
            currentTask.works = currentTask.works.filter(w => w._id !== workId);
            refreshUI(); 
            TaskView.updateBoardCard(currentTask, isOverdue);
            toast.success(t('task.deleted_success'));
        } else toast.error("Lỗi xóa");
    });
};

window.addMemberToTask = async (memberId) => {
    if (!canEditTask) return toast.error(t('task.no_permission'));
    if (isOverdue) return toast.error(t('task.msg_overdue'));

    const newIds = [...currentTask.members.map(m => m._id), memberId];
    const data = await TaskAPI.update(currentTask._id, { members: newIds });
    if (data.task) {
        currentTask = data.task;
        toast.success(t('task.msg_update_member_success'));
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
    if (!newContent) return toast.error(t('comment.empty'));

    try {
        const data = await TaskAPI.updateComment(commentId, newContent);
        if (data.comment) {
            const idx = currentTask.comments.findIndex(c => c._id === commentId);
            if (idx !== -1) currentTask.comments[idx] = data.comment;
            TaskView.renderComments(currentTask.comments);
            toast.success(t('comment.updated'));
        } else {
            toast.error(data.err || "Lỗi");
        }
    } catch (err) { toast.error("Lỗi kết nối"); }
};

window.deleteComment = async (commentId) => {
    showConfirm(t('comment.delete_confirm'), async () => {
        try {
            const success = await TaskAPI.deleteComment(commentId);
            if (success) {
                currentTask.comments = currentTask.comments.filter(c => c._id !== commentId);
                TaskView.renderComments(currentTask.comments);
                toast.success(t('comment.deleted'));
            } else {
                toast.error("Error");
            }
        } catch (err) { toast.error("Error"); }
    });
};

// --- FILE MANAGER ---
async function loadFileManager() {
    const container = document.getElementById('file-list-container');
    container.innerHTML = `<div style="font-size:0.8rem; color:#666;">${t('dash.loading')}</div>`;
    const data = await TaskAPI.getFiles(currentTask._id, currentFolderId);
    renderFileList(data.folders, data.files);
    renderBreadcrumb();
}

function renderFileList(folders, files) {
    const container = document.getElementById('file-list-container');
    container.innerHTML = '';

    if (folders.length === 0 && files.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #999; font-size: 0.85rem; padding: 20px;">${t('file.empty')}</div>`;
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
        if (f.mimetype && f.mimetype.includes('image')) { icon = 'fa-file-image'; color = '#a6c5f7'; }
        else if (f.mimetype && f.mimetype.includes('pdf')) { icon = 'fa-file-pdf'; color = '#d93025'; }
        
        const serverRoot = API_BASE_URL.replace('/api', '');
        
        let rawPath = f.path.replace(/\\/g, '/'); 
        if (rawPath.includes('uploads/')) {
            rawPath = rawPath.substring(rawPath.indexOf('uploads/'));
        }
        
        const fileUrl = `${serverRoot}/${rawPath}`;

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

// [CẬP NHẬT] Hàm tạo thư mục sử dụng Modal
function handleCreateFolder() {
    if (!canEditTask) return toast.error(t('task.no_permission'));
    
    // Tìm modal và input
    const modal = document.getElementById('create-folder-modal');
    const input = document.getElementById('new-folder-name');
    
    if (modal && input) {
        modal.style.display = 'flex';
        // Focus vào ô input để nhập luôn
        setTimeout(() => input.focus(), 100);
    }
}

async function handleUploadFile(e) {
    console.log("📂 Bắt đầu sự kiện upload...");
    
    const input = e.target;
    const file = input.files[0];
    
    if (!file) {
        console.log("❌ Người dùng đã hủy chọn file.");
        return;
    }

    if (!canEditTask) {
        toast.error(t('file.no_permission_upload') || t('task.no_permission'));
        input.value = '';
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        toast.error(t('file.too_large'));
        input.value = '';
        return;
    }

    toast.info(`${t('file.uploading')} ${file.name}...`);
    
    try {
        const data = await TaskAPI.uploadFile(file, currentTask._id, currentFolderId);
        if (data && data.file) {
            await loadFileManager();
            toast.success(t('file.upload_success'));
        } else {
            toast.error(t('file.upload_error') || "Error");
        }
    } catch (err) { toast.error("Error");
    } finally {
        input.value = ''; 
    }
}

async function deleteItem(type, id) {
    if (!canEditTask) return toast.error(t('task.no_permission'));
    const msg = type === 'file' ? t('file.confirm_delete_file') : t('file.confirm_delete_folder');
    showConfirm(msg, async () => {
        await TaskAPI.deleteItem(type, id);
        loadFileManager();
        toast.success(t('task.deleted_success'));
    });
}