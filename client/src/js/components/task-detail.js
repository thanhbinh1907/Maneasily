import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';
import { showConfirm } from '../utils/confirm.js';
import '../../css/components/task-detail.css';

let currentTask = null;
let canEditTask = false;

const formatTimeRemaining = (deadline) => {
    if (!deadline) return "";
    const diff = new Date(deadline) - new Date();
    if (diff < 0) return `<span class="time-late" style="color:#d93025">Đã quá hạn!</span>`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if(days > 0) return `<span class="time-ok" style="color:#2e8b57">Còn lại: ${days} ngày ${hours % 24} giờ</span>`;
    return `<span class="time-ok" style="color:#2e8b57">Còn lại: ${hours} giờ ${mins} phút</span>`;
};

export function initTaskDetailModal() {
    const modal = document.getElementById('task-detail-modal');
    const closeBtn = document.getElementById('close-detail-modal');
    
    const closeModal = () => { if(modal) modal.style.display = 'none'; };
    
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    // Các sự kiện update (Dùng ? để an toàn)
    document.getElementById('detail-title')?.addEventListener('blur', () => updateTaskField('title'));
    
    document.getElementById('btn-save-desc')?.addEventListener('click', () => {
        updateTaskField('dec');
        document.getElementById('btn-save-desc').style.display = 'none';
    });
    
    document.getElementById('detail-desc')?.addEventListener('focus', () => {
        if(canEditTask) document.getElementById('btn-save-desc').style.display = 'inline-block';
    });
    
    document.getElementById('detail-deadline')?.addEventListener('change', () => updateTaskField('deadline'));
    document.getElementById('btn-save-tag')?.addEventListener('click', () => updateTaskField('tag'));
    
    document.getElementById('btn-add-subtask')?.addEventListener('click', addSubtask);
    document.getElementById('btn-post-comment')?.addEventListener('click', postComment);

    // Nút xóa trong detail
    document.getElementById('btn-delete-task-detail')?.addEventListener('click', () => {
        if(!currentTask) return;
        showConfirm("Xóa công việc này?", async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/task/${currentTask._id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                });
                if(res.ok) {
                    toast.success("Đã xóa task");
                    closeModal();
                    setTimeout(() => location.reload(), 500);
                } else {
                    toast.error("Lỗi xóa task");
                }
            } catch(e) { toast.error("Lỗi kết nối"); }
        });
    });
}

// --- HÀM MỞ MODAL (Được Board.js gọi) ---
export async function openTaskDetail(taskId, isUserAdminOrManager) {
    const modal = document.getElementById('task-detail-modal');
    const loadingEl = document.getElementById('detail-title');
    
    if (modal) modal.style.display = 'flex';
    canEditTask = isUserAdminOrManager; 
    if (loadingEl) loadingEl.value = "Đang tải...";

    try {
        const token = localStorage.getItem('maneasily_token');
        const res = await fetch(`${API_BASE_URL}/task/${taskId}`, {
            headers: { 'Authorization': token }
        });
        const data = await res.json();
        
        if (res.ok) {
            currentTask = data.task;
            renderTaskDetail(data.task);
        } else {
            toast.error("Không thể tải chi tiết task");
            if (modal) modal.style.display = 'none';
        }
    } catch (err) { console.error(err); toast.error("Lỗi kết nối"); }
}

function renderTaskDetail(task) {
    // 1. Render Info Cơ bản
    const titleEl = document.getElementById('detail-title');
    if(titleEl) titleEl.value = task.title;
    
    const descEl = document.getElementById('detail-desc');
    if(descEl) descEl.value = task.dec || "";
    
    const tagInput = document.getElementById('detail-tag-input');
    if(tagInput) tagInput.value = task.tag || "";
    
    // Hiển thị Deadline
    const deadlineInput = document.getElementById('detail-deadline');
    const timeDisplay = document.getElementById('time-remaining-display');
    
    if (deadlineInput && timeDisplay) {
        if (task.deadline) {
            const d = new Date(task.deadline);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            deadlineInput.value = d.toISOString().slice(0, 16);
            timeDisplay.innerHTML = formatTimeRemaining(task.deadline);
        } else {
            deadlineInput.value = "";
            timeDisplay.innerHTML = "";
        }
    }

    // 2. Render Members
    const memberList = document.getElementById('detail-members-list');
    if (memberList) {
        memberList.innerHTML = task.members.map(m => 
            `<img src="${m.avatar}" title="${m.username}" style="width:32px; height:32px; border-radius:50%;">`
        ).join('');
    }

    // 3. Render Subtasks
    if(task.works) renderSubtasks(task.works);

    // 4. Render Comments
    if(task.comments) renderComments(task.comments);

    // 5. Phân quyền UI
    toggleEditMode(canEditTask);
}

function renderSubtasks(works) {
    const list = document.getElementById('subtask-list');
    const progressText = document.getElementById('progress-percent');
    const progressBar = document.getElementById('detail-progress-bar');
    const countEl = document.getElementById('subtask-count');

    if (!list) return;

    const total = works.length;
    const completed = works.filter(w => w.isDone).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    if(progressText) progressText.textContent = `${percent}%`;
    if(progressBar) progressBar.style.width = `${percent}%`;
    if(countEl) countEl.textContent = total > 0 ? `${completed}/${total}` : "0";

    list.innerHTML = works.map(w => `
        <div class="subtask-item ${w.isDone ? 'completed' : ''}" style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #eee;">
            <input type="checkbox" ${w.isDone ? 'checked' : ''} 
                   onchange="window.toggleSubtask('${w._id}')" 
                   ${!canEditTask ? 'disabled' : ''} style="cursor: pointer;">
            <span class="subtask-text" style="flex-grow: 1; ${w.isDone ? 'text-decoration: line-through; color: #999;' : ''}">${w.title}</span>
        </div>
    `).join('');
}

function renderComments(comments) {
    const list = document.getElementById('comment-list');
    if (!list) return;

    const me = JSON.parse(localStorage.getItem('maneasily_user')) || {};
    const myAvatar = document.getElementById('my-comment-avatar');
    if(myAvatar) myAvatar.src = me.avatar || "https://www.gravatar.com/avatar/default?d=mp";

    list.innerHTML = comments.map(c => `
        <div class="comment-item" style="display: flex; gap: 10px; margin-bottom: 15px;">
            <img src="${c.user?.avatar || 'https://www.gravatar.com/avatar/default?d=mp'}" class="comment-avatar" style="width: 32px; height: 32px; border-radius: 50%;">
            <div class="comment-box" style="background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #dfe1e6; flex-grow: 1;">
                <div class="comment-header" style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">
                    ${c.user?.username || 'Người dùng'} 
                    <span style="font-weight:400; color:#999; font-size:0.7rem;">${new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <div>${c.content}</div>
            </div>
        </div>
    `).join('');
}

function toggleEditMode(canEdit) {
    const elementsToDisable = [
        'detail-title', 'detail-desc', 'btn-save-desc', 
        'new-subtask-input', 'btn-add-subtask', 
        'detail-tag-input', 'btn-save-tag', 'detail-deadline',
        'btn-add-member-detail', 'btn-delete-task-detail'
    ];
    
    elementsToDisable.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.disabled = !canEdit;
            // Nếu là button thì ẩn luôn cho gọn
            if(!canEdit && el.tagName === 'BUTTON') el.style.display = 'none';
            else if (canEdit && el.tagName === 'BUTTON' && id !== 'btn-save-desc') el.style.display = 'inline-block';
        }
    });
}

// --- API ACTIONS ---

async function updateTaskField(field) {
    if (!canEditTask || !currentTask) return;
    let value;
    
    if (field === 'title') value = document.getElementById('detail-title').value;
    if (field === 'dec') value = document.getElementById('detail-desc').value;
    if (field === 'deadline') value = document.getElementById('detail-deadline').value;
    if (field === 'tag') {
        value = document.getElementById('detail-tag-input').value;
        const color = document.querySelector('input[name="detailColor"]:checked')?.value;
        await callUpdateAPI({ tag: value, color: color });
        return;
    }

    await callUpdateAPI({ [field]: value });
}

async function callUpdateAPI(body) {
    try {
        const res = await fetch(`${API_BASE_URL}/task/${currentTask._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
            body: JSON.stringify(body)
        });
        if (res.ok) toast.success("Đã cập nhật!");
    } catch (e) { toast.error("Lỗi cập nhật"); }
}

async function addSubtask() {
    const input = document.getElementById('new-subtask-input');
    const title = input.value.trim();
    if (!title) return;

    try {
        const res = await fetch(`${API_BASE_URL}/task/work`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
            body: JSON.stringify({ title, taskId: currentTask._id })
        });
        const data = await res.json();
        if (res.ok) {
            input.value = "";
            currentTask.works.push(data.work);
            renderSubtasks(currentTask.works);
        }
    } catch (e) { toast.error("Lỗi thêm việc"); }
}

async function postComment() {
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API_BASE_URL}/task/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
            body: JSON.stringify({ content, taskId: currentTask._id })
        });
        const data = await res.json();
        if (res.ok) {
            input.value = "";
            currentTask.comments.push(data.comment);
            renderComments(currentTask.comments);
        }
    } catch (e) { toast.error("Lỗi gửi bình luận"); }
}

// Expose function ra window để gọi từ HTML checkbox
window.toggleSubtask = async (workId) => {
    if (!canEditTask) return;
    try {
        await fetch(`${API_BASE_URL}/task/work/${workId}`, {
            method: 'PUT',
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const work = currentTask.works.find(w => w._id === workId);
        if (work) {
            work.isDone = !work.isDone;
            renderSubtasks(currentTask.works);
        }
    } catch (e) { toast.error("Lỗi cập nhật"); }
};