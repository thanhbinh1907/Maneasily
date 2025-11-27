export const formatTimeRemaining = (deadline) => {
    if (!deadline) return { html: "", isOverdue: false };
    const diff = new Date(deadline) - new Date();
    const isOverdue = diff < 0;
    
    if (isOverdue) return { html: `<span class="time-late" style="color:#d93025; font-weight:bold">⚠️ Đã quá hạn!</span>`, isOverdue: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    const text = days > 0 ? `Còn lại: ${days} ngày ${hours % 24} giờ` : `Còn lại: ${hours} giờ`;
    return { html: `<span class="time-ok" style="color:#2e8b57">${text}</span>`, isOverdue: false };
};

export const TaskView = {
    renderInfo: (task) => {
        document.getElementById('detail-title').value = task.title;
        document.getElementById('detail-desc').value = task.dec || "";
        document.getElementById('detail-tag-input').value = task.tag || "";
        const colEl = document.getElementById('detail-column-name');
        if(colEl) colEl.textContent = (task.column && task.column.title) ? task.column.title : "...";

        // Color Radio & Picker
        const colorRadios = document.querySelectorAll('input[name="detailColor"]');
        const colorPicker = document.getElementById('detail-custom-color');
        let match = false;
        colorRadios.forEach(r => {
            if (r.value === task.color) { r.checked = true; match = true; } else r.checked = false;
        });
        if (colorPicker) colorPicker.value = task.color;

        // Deadline
        const deadlineInput = document.getElementById('detail-deadline');
        const timeDisplay = document.getElementById('time-remaining-display');
        if (deadlineInput && task.deadline) {
            const d = new Date(task.deadline);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            deadlineInput.value = d.toISOString().slice(0, 16);
            timeDisplay.innerHTML = formatTimeRemaining(task.deadline).html;
        } else if (deadlineInput) {
            deadlineInput.value = "";
            timeDisplay.innerHTML = "";
        }
    },

    renderMembers: (members, canEdit) => {
        const list = document.getElementById('detail-members-list');
        if (!list) return;
        
        if (members.length === 0) {
            list.innerHTML = '<span style="color:#999; font-size:0.8rem;">Chưa có thành viên</span>';
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

    renderSubtasks: (works, canEdit, isOverdue) => {
        const list = document.getElementById('subtask-list');
        if (!list) return;

        const total = works.length;
        const completed = works.filter(w => w.isDone).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        document.getElementById('progress-percent').textContent = `${percent}%`;
        document.getElementById('detail-progress-bar').style.width = `${percent}%`;
        document.getElementById('subtask-count').textContent = total > 0 ? `${completed}/${total}` : "0";

        const isDisabled = !canEdit || isOverdue;

        list.innerHTML = works.map(w => {
            // Avatar người làm
            let subMembersHTML = '';
            if (w.members && w.members.length > 0) {
                subMembersHTML = w.members.map(m => 
                    `<img src="${m.avatar}" title="${m.username}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; margin-left: -8px; object-fit: cover;">`
                ).join('');
            }

            // --- THAY ĐỔI Ở ĐÂY: MENU 3 CHẤM ---
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
                       onclick="event.stopPropagation(); window.toggleSubtask('${w._id}')" style="pointer-events:none;">
                
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

        if (available.length === 0) { list.innerHTML = '<div style="font-size:0.8rem; color:#999;">Hết thành viên.</div>'; return; }
        list.innerHTML = available.map(m => `
            <div class="member-option" onclick="window.addMemberToTask('${m._id}')" style="display:flex; align-items:center; gap:10px; padding:6px; cursor:pointer;">
                <img src="${m.avatar}" style="width:24px; height:24px; border-radius:50%;">
                <span style="font-size:0.9rem;">${m.username}</span>
            </div>`).join('');
    },

    toggleEditMode: (canEdit) => {
        const ids = ['detail-title', 'detail-desc', 'btn-save-desc', 'new-subtask-input', 'btn-add-subtask', 'detail-tag-input', 'btn-save-tag', 'detail-deadline', 'btn-add-member-detail', 'btn-delete-task-detail'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.disabled = !canEdit;
                if(el.tagName === 'BUTTON') {
                    // Hiển thị lại nút nếu có quyền (trừ nút lưu desc)
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
        card.querySelector('.task-title').textContent = task.title;
        card.querySelector('.task-desc').textContent = task.dec;
        
        let tagEl = card.querySelector('.task-tag');
        if (!tagEl && task.tag) {
            tagEl = document.createElement('div'); tagEl.className = 'task-tag';
            card.querySelector('.task-title').before(tagEl);
        }
        if (tagEl) {
            if (task.tag) { tagEl.textContent = task.tag; tagEl.style.backgroundColor = task.color || '#00c2e0'; tagEl.style.display = 'inline-block'; }
            else tagEl.style.display = 'none';
        }
        card.style.borderLeft = isOverdue ? "4px solid #d93025" : "";

        const membersContainer = card.querySelector('.task-members');
        if (membersContainer && task.members) {
            membersContainer.innerHTML = task.members.map(u => `<img src="${u.avatar}" title="${u.username}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; margin-right: -8px;">`).join('');
        }
    }
};