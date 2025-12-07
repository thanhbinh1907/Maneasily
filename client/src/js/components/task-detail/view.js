import { t } from '../../utils/i18n.js'; // [MỚI] Import hàm dịch

export const formatTimeRemaining = (deadline, startTime) => {
    const now = new Date();

    // 1. Kiểm tra thời gian bắt đầu
    if (startTime) {
        const start = new Date(startTime);
        const diffStart = start - now;

        if (diffStart > 0) {
            const hours = Math.floor(diffStart / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            
            let text = "";
            if (days > 0) {
                text = `${t('time.starts_in')} ${days} ${t('time.day')} ${hours % 24} ${t('time.hour')}`;
            } else {
                text = `${t('time.starts_in')} ${hours} ${t('time.hour')} ${Math.floor((diffStart / (1000 * 60)) % 60)} ${t('time.minute')}`;
            }

            return { 
                html: `<span style="color:#e67e22; font-weight:600"><i class="fa-regular fa-hourglass-half"></i> ${text}</span>`, 
                isOverdue: false 
            };
        }
    }

    // 2. Kiểm tra Deadline
    if (!deadline) return { html: "", isOverdue: false };
    
    const diff = new Date(deadline) - now;
    const isOverdue = diff < 0;
    
    if (isOverdue) {
        return { 
            html: `<span class="time-late" style="color:#d93025; font-weight:bold">⚠️ ${t('time.overdue')}</span>`, 
            isOverdue: true 
        };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    const text = days > 0 
        ? `${t('time.remaining')} ${days} ${t('time.day')} ${hours % 24} ${t('time.hour')}` 
        : `${t('time.remaining')} ${hours} ${t('time.hour')}`;
        
    return { 
        html: `<span class="time-ok" style="color:#2e8b57">${text}</span>`, 
        isOverdue: false 
    };
};

export const TaskView = {
    renderInfo: (task) => {
        document.getElementById('detail-title').value = task.title;
        document.getElementById('detail-desc').value = task.dec || "";
        document.getElementById('detail-tag-input').value = task.tag || "";
        const colEl = document.getElementById('detail-column-name');
        if(colEl) colEl.textContent = (task.column && task.column.title) ? task.column.title : "...";

        // Color
        const colorRadios = document.querySelectorAll('input[name="detailColor"]');
        const colorPicker = document.getElementById('detail-custom-color');
        colorRadios.forEach(r => {
            if (r.value === task.color) r.checked = true; else r.checked = false;
        });
        if (colorPicker) colorPicker.value = task.color;

        // Start Time
        const startInput = document.getElementById('detail-start-time');
        if (startInput) {
            if (task.startTime) {
                const s = new Date(task.startTime);
                s.setMinutes(s.getMinutes() - s.getTimezoneOffset());
                startInput.value = s.toISOString().slice(0, 16);
            } else {
                startInput.value = "";
            }
        }

        // Deadline
        const deadlineInput = document.getElementById('detail-deadline');
        if (deadlineInput) {
            if (task.deadline) {
                const d = new Date(task.deadline);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                deadlineInput.value = d.toISOString().slice(0, 16);
            } else {
                deadlineInput.value = "";
            }
        }

        // [CẬP NHẬT] Gọi hàm formatTimeRemaining với cả 2 tham số
        const timeDisplay = document.getElementById('time-remaining-display');
        if (timeDisplay) {
            // Kiểm tra xem đã xong chưa
            const isAllDone = task.works && task.works.length > 0 && task.works.every(w => w.isDone);
            
            if (isAllDone) {
                // Nếu xong rồi -> Hiện chữ xanh "Đã hoàn thành"
                timeDisplay.innerHTML = `<span style="color:#2e8b57; font-weight:bold"><i class="fa-solid fa-check-circle"></i> ${t('task.status_done')}</span>`;
            } else {
                // Nếu chưa xong -> Hiện đếm ngược hoặc quá hạn
                timeDisplay.innerHTML = formatTimeRemaining(task.deadline, task.startTime).html;
            }
        }
    },

    renderMembers: (members, canEdit) => {
        const list = document.getElementById('detail-members-list');
        if (!list) return;
        
        if (members.length === 0) {
            list.innerHTML = `<span style="color:#999; font-size:0.8rem;">${t('task.no_members')}</span>`;
            return;
        }

        list.innerHTML = members.map(m => `
            <div class="member-chip" draggable="${canEdit}" ondragstart="event.dataTransfer.setData('memberId_subtask', '${m._id}')"
                 style="display:flex; align-items:center; gap:5px; background:#fff; border:1px solid #dfe1e6; border-radius:20px; padding:2px 8px 2px 2px; cursor:grab;">
                <img src="${m.avatar}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                <span style="font-size:0.85rem; font-weight:500;">${m.username}</span>
                
                ${canEdit ? `
                <i class="fa-solid fa-xmark" 
                   onclick="window.removeMemberFromTask('${m._id}')" 
                   style="color:#d93025; cursor:pointer; margin-left:5px;"
                   title="Xóa người này"></i>
                ` : ''}
            </div>
        `).join('');
    },

    renderSubtasks: (works, canEdit, isOverdue, isNotStarted) => {
        const list = document.getElementById('subtask-list');
        if (!list) return;

        const total = works.length;
        const completed = works.filter(w => w.isDone).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('progress-percent').textContent = `${percent}%`;
        document.getElementById('detail-progress-bar').style.width = `${percent}%`;
        document.getElementById('subtask-count').textContent = total > 0 ? `${completed}/${total}` : "0";

        // [LOGIC MỚI] Khóa nếu: Không có quyền OR Quá hạn OR Chưa bắt đầu
        const isDisabled = !canEdit || isOverdue || isNotStarted;

        list.innerHTML = works.map(w => {
            let subMembersHTML = '';
            if (w.members && w.members.length > 0) {
                subMembersHTML = w.members.map(m => 
                    `<img src="${m.avatar}" title="${m.username}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; margin-left: -8px; object-fit: cover;">`
                ).join('');
            }

            const menuHTML = canEdit ? `
                <div class="subtask-menu-container">
                    <i class="fa-solid fa-ellipsis subtask-menu-btn" onclick="event.stopPropagation(); window.toggleSubtaskMenu('${w._id}')"></i>
                    <div id="subtask-menu-${w._id}" class="subtask-dropdown">
                        <div class="subtask-dropdown-item" onclick="event.stopPropagation(); window.openSubtaskManager('${w._id}')">
                            <i class="fa-solid fa-users-gear"></i> Quản lý thành viên
                        </div>
                        <div class="subtask-dropdown-item delete" onclick="event.stopPropagation(); window.deleteSubtask('${w._id}')">
                            <i class="fa-regular fa-trash-can"></i> Xóa công việc
                        </div>
                    </div>
                </div>
            ` : '';

            return `
            <div class="subtask-item ${w.isDone ? 'completed' : ''}" 
                 style="display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid #eee; cursor:${isDisabled?'not-allowed':'default'}; position:relative;"
                 ondrop="window.handleSubtaskDrop(event, '${w._id}')" ondragover="event.preventDefault()">
                 
                <input type="checkbox" ${w.isDone ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} 
                       onclick="event.stopPropagation(); window.toggleSubtask('${w._id}')" 
                       style="cursor: pointer; width: 16px; height: 16px;">
                
                <span class="subtask-text" style="flex-grow:1; ${w.isDone?'text-decoration:line-through; color:#999':''}" 
                      onclick="${!isDisabled ? `window.toggleSubtask('${w._id}')` : ''}">${w.title}</span>
                
                <div style="display:flex; margin-right:10px; padding-left:5px;">${subMembersHTML}</div>
                
                ${menuHTML}
            </div>`;
        }).join('');
    },

    renderComments: (comments) => {
        const list = document.getElementById('comment-list');
        if (!list) return;
        const me = JSON.parse(localStorage.getItem('maneasily_user')) || {};
        document.getElementById('my-comment-avatar').src = me.avatar || "https://www.gravatar.com/avatar/default?d=mp";

        list.innerHTML = comments.map(c => `
            <div class="comment-item" style="display:flex; gap:10px; margin-bottom:15px;">
                <img src="${c.user?.avatar}" style="width:32px; height:32px; border-radius:50%;">
                <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #dfe1e6; flex-grow:1;">
                    <div style="font-weight:600; font-size:0.85rem; margin-bottom:4px;">${c.user?.username} <span style="font-weight:400; color:#999; font-size:0.7rem;">${new Date(c.createdAt).toLocaleString()}</span></div>
                    <div>${c.content}</div>
                </div>
            </div>`).join('');
    },

    renderAvailableMembers: (taskMembers, allMembers) => {
        const list = document.getElementById('available-members-list');
        if (!list) return;
        const currentIds = taskMembers.map(m => m._id);
        const available = allMembers.filter(m => !currentIds.includes(m._id));

        if (available.length === 0) { 
            list.innerHTML = `<div style="font-size:0.8rem; color:#999;">${t('task.no_available_members')}</div>`; 
            return; 
        }
        list.innerHTML = available.map(m => `
            <div class="member-option" onclick="window.addMemberToTask('${m._id}')" style="display:flex; align-items:center; gap:10px; padding:6px; cursor:pointer;">
                <img src="${m.avatar}" style="width:24px; height:24px; border-radius:50%;">
                <span style="font-size:0.9rem;">${m.username}</span>
            </div>`).join('');
    },

    toggleEditMode: (canEdit) => {
        const ids = ['detail-title', 'detail-desc', 'btn-save-desc', 'new-subtask-input', 'btn-add-subtask', 'detail-tag-input', 'btn-save-tag', 'detail-start-time', 'detail-deadline', 'btn-add-member-detail', 'btn-delete-task-detail'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.disabled = !canEdit;
                if(el.tagName === 'BUTTON') {
                    if(canEdit) {
                        if(id !== 'btn-save-desc') el.style.display = ''; 
                    } else {
                        el.style.display = 'none';
                    }
                }
            }
        });
    },

    updateBoardCard: (task, isOverdue) => {
        const card = document.querySelector(`.task-card[data-task-id="${task._id}"]`);
        if (!card) return;

        // 1. Cập nhật tiêu đề & tag (Giữ nguyên cũ)
        card.querySelector('.task-title').textContent = task.title;
        
        let tagEl = card.querySelector('.task-tag');
        if (!tagEl && task.tag) {
            tagEl = document.createElement('div'); tagEl.className = 'task-tag';
            const titleEl = card.querySelector('.task-title');
            if(titleEl) titleEl.parentNode.insertBefore(tagEl, titleEl);
        }
        if (tagEl) {
            if (task.tag) { 
                tagEl.textContent = task.tag; 
                tagEl.style.backgroundColor = task.color || '#00c2e0'; 
                tagEl.style.display = 'inline-block'; 
            } else tagEl.style.display = 'none';
        }

        // --- 2. [LOGIC MỚI] Cập nhật màu viền (Xanh/Đỏ) ---
        // Kiểm tra hoàn thành: Có subtask VÀ tất cả đều xong
        const isAllWorksDone = task.works && task.works.length > 0 && task.works.every(w => w.isDone);

        if (isAllWorksDone) {
            card.style.borderLeft = "4px solid #2e8b57"; // Xanh lá
        } else if (isOverdue) {
            card.style.borderLeft = "4px solid #d93025"; // Đỏ
        } else {
            card.style.borderLeft = ""; // Reset về mặc định
        }
        // --------------------------------------------------

        // 3. Cập nhật thành viên (Giữ nguyên cũ)
        const membersContainer = card.querySelector('.task-members');
        if (membersContainer && task.members) {
            membersContainer.innerHTML = task.members.map(u => `<img src="${u.avatar}" title="${u.username}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; margin-right: -8px;">`).join('');
        }
    },

    renderComments: (comments) => {
        const list = document.getElementById('comment-list');
        if (!list) return;
        
        // Lấy thông tin user hiện tại
        const me = JSON.parse(localStorage.getItem('maneasily_user')) || {};
        document.getElementById('my-comment-avatar').src = me.avatar || "https://www.gravatar.com/avatar/default?d=mp";

        list.innerHTML = comments.map(c => {
            const isMyComment = c.user?._id === me._id;
            
            // Nút thao tác (chỉ hiện nếu là comment của mình)
            const actions = isMyComment ? `
                <div class="comment-actions" style="font-size: 0.75rem; margin-top: 5px; color: #5e6c84;">
                    <span style="cursor:pointer; margin-right:8px; text-decoration:underline;" onclick="window.enableEditComment('${c._id}')">${t('comment.edit')}</span>
                    <span style="cursor:pointer; text-decoration:underline;" onclick="window.deleteComment('${c._id}')">${t('comment.delete')}</span>
                </div>
            ` : '';

            return `
            <div class="comment-item" id="comment-item-${c._id}" style="display:flex; gap:10px; margin-bottom:15px;">
                <img src="${c.user?.avatar}" style="width:32px; height:32px; border-radius:50%;">
                
                <div style="flex-grow:1;">
                    <div id="comment-view-${c._id}" style="background:#fff; padding:10px; border-radius:8px; border:1px solid #dfe1e6;">
                        <div style="font-weight:600; font-size:0.85rem; margin-bottom:4px;">
                            ${c.user?.username} 
                            <span style="font-weight:400; color:#999; font-size:0.7rem;">${new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div id="comment-content-${c._id}" style="white-space: pre-wrap;">${c.content}</div>
                    </div>

                    <div id="comment-edit-${c._id}" style="display:none;">
                        <textarea id="input-edit-${c._id}" style="width:100%; padding:8px; border:1px solid #0079bf; border-radius:6px; min-height:60px;">${c.content}</textarea>
                        <div style="margin-top:5px; display:flex; gap:5px;">
                            <button onclick="window.saveEditComment('${c._id}')" class="btn-modal btn-submit" style="padding:4px 10px; font-size:0.8rem;">${t('comment.save')}</button>
                            <button onclick="window.cancelEditComment('${c._id}')" class="btn-modal btn-cancel" style="padding:4px 10px; font-size:0.8rem;">${t('comment.cancel')}</button>
                        </div>
                    </div>

                    ${actions}
                </div>
            </div>`;
        }).join('');
    },
};