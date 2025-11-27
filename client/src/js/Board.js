import Sortable from 'sortablejs';
import { initProfileModal } from './components/profile-modal.js';
import { API_BASE_URL } from './config.js';
import { initShareFeature, renderProjectMembers } from './components/share-modal.js';
import { toast } from './utils/toast.js';
import { initTaskModal, openTaskModal } from './components/task-modal.js';
import { initColumnModal, openColumnModal } from './components/column-modal.js';
import { showConfirm } from './utils/confirm.js';
import { initTaskDetailModal, openTaskDetail } from './components/task-detail/index.js';

let currentProjectId = null;
let boardContainer = null;
let isUserAdminOrManager = false;
let projectMembers = [];

/* =========================================s
   HELPER FUNCTIONS
   ========================================= */
function isTaskOverdue(deadline) {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
}

/* =========================================
   PHẦN 1: RENDER GIAO DIỆN (VIEW)
   ========================================= */

function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('data-task-id', task._id);
  
  // Logic Viền Đỏ (Quá hạn)
  if (isTaskOverdue(task.deadline)) {
      card.style.borderLeft = "4px solid #d93025"; 
  }

  const tagColor = task.color || '#00c2e0';
  const tagHTML = task.tag ? `<div class="task-tag" style="background-color: ${tagColor};">${task.tag}</div>` : '';
  const descHTML = task.dec ? `<div class="task-desc">${task.dec}</div>` : '';

  // Render thành viên
  let membersHTML = '';
  if (task.members && task.members.length > 0) {
      membersHTML = task.members.map(u => 
          `<img src="${u.avatar}" title="${u.username}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; margin-right: -8px;">`
      ).join('');
  }

  // Nút xóa Task
  let deleteBtnHTML = '';
  if (isUserAdminOrManager) {
      deleteBtnHTML = `<i class="fa-regular fa-trash-can btn-delete-task" title="Xóa công việc" style="cursor: pointer; color: #d93025; font-size: 0.9rem; opacity: 0.6; transition: opacity 0.2s;"></i>`;
  }

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
        ${tagHTML}
        ${deleteBtnHTML}
    </div>
    <div class="task-title">${task.title}</div>
    ${descHTML}
    <div class="task-footer">
        <div class="task-members" style="display: flex; padding-left: 8px;">${membersHTML}</div>
        <div class="task-stats">
            ${task.deadline ? `<i class="fa-regular fa-clock" style="${isTaskOverdue(task.deadline) ? 'color:#d93025' : ''}"></i>` : ''}
        </div>
    </div>
  `;

  // Logic Xóa Task
  if (isUserAdminOrManager) {
      const delBtn = card.querySelector('.btn-delete-task');
      delBtn.addEventListener('mouseenter', () => delBtn.style.opacity = '1');
      delBtn.addEventListener('mouseleave', () => delBtn.style.opacity = '0.6');
      
      delBtn.addEventListener('click', (e) => {
          e.stopPropagation(); 
          showConfirm("Bạn chắc chắn muốn xóa công việc này?", async () => {
              try {
                  const res = await fetch(`${API_BASE_URL}/task/${task._id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                  });
                  if (res.ok) {
                      card.remove();
                      toast.success("Đã xóa công việc");
                  } else {
                      toast.error("Lỗi khi xóa");
                  }
              } catch (err) { toast.error("Lỗi server"); }
          });
      });

      // Logic Kéo thả thành viên
      card.addEventListener('dragover', (e) => { e.preventDefault(); card.style.backgroundColor = "#ebecf0"; });
      card.addEventListener('dragleave', () => { card.style.backgroundColor = "#fff"; });
      card.addEventListener('drop', async (e) => {
          e.preventDefault();
          card.style.backgroundColor = "#fff";
          toast.info("Tính năng gán thành viên đang phát triển...");
      });
  }

  card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-task')) return;
      openTaskDetail(task._id, isUserAdminOrManager, projectMembers);
  });

  return card;
}

function createColumnElement(column) {
  const columnEl = document.createElement('div');
  columnEl.className = 'board-column'; 
  columnEl.setAttribute('data-column-id', column._id);

  const taskCount = column.tasks ? column.tasks.length : 0;

  let actionButtons = '';
  if (isUserAdminOrManager) {
      actionButtons = `
        <button class="btn-add-task-header" title="Thêm nhiệm vụ mới"><i class="fa-solid fa-plus"></i></button>
        <i class="fa-solid fa-xmark btn-delete-column" title="Xóa cột" style="cursor: pointer; color: #6b778c; margin-left: 12px; font-size: 1.1rem;"></i>
      `;
  }

  const header = document.createElement('div');
  header.className = 'column-header';
  header.innerHTML = `
    <div class="column-title-wrapper">
        <h3 class="column-title">${column.title}</h3>
        <input type="text" class="column-title-input" value="${column.title}" style="display:none; width: 150px; padding: 4px; border: 1px solid #0079bf; border-radius: 4px;">
        <span class="task-count">${taskCount}</span>
    </div>
    <div style="display: flex; align-items: center;">
        ${actionButtons}
    </div>
  `;

  if (isUserAdminOrManager) {
      const delColBtn = header.querySelector('.btn-delete-column');
      delColBtn.addEventListener('click', () => {
          showConfirm(`Xóa cột "${column.title}" và toàn bộ công việc bên trong?`, async () => {
              try {
                  const res = await fetch(`${API_BASE_URL}/column/${column._id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                  });
                  if (res.ok) {
                      columnEl.remove();
                      toast.success("Đã xóa cột");
                  } else {
                      const d = await res.json();
                      toast.error(d.err || "Lỗi xóa cột");
                  }
              } catch (err) { toast.error("Lỗi server"); }
          });
      });

      const btnAdd = header.querySelector('.btn-add-task-header');
      btnAdd.addEventListener('click', () => openTaskModal(column._id, currentProjectId));

      const titleEl = header.querySelector('.column-title');
      const inputEl = header.querySelector('.column-title-input');
      titleEl.title = "Double click để sửa tên";
      
      titleEl.addEventListener('dblclick', () => {
          titleEl.style.display = 'none'; inputEl.style.display = 'block'; inputEl.focus();
      });

      const saveTitle = async () => {
          const newTitle = inputEl.value.trim();
          if(newTitle && newTitle !== titleEl.textContent) {
              try {
                  await fetch(`${API_BASE_URL}/column/${column._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
                      body: JSON.stringify({ title: newTitle })
                  });
                  titleEl.textContent = newTitle;
                  toast.success("Đã đổi tên cột");
              } catch(e) { toast.error("Lỗi lưu tên"); inputEl.value = titleEl.textContent; }
          }
          inputEl.style.display = 'none'; titleEl.style.display = 'block';
      };
      inputEl.addEventListener('blur', saveTitle);
      inputEl.addEventListener('keypress', (e) => { if(e.key === 'Enter') saveTitle(); });
  }

  const taskListEl = document.createElement('div');
  taskListEl.className = 'task-list';
  taskListEl.setAttribute('data-column-id', column._id);

  if (column.tasks && column.taskOrder) {
    const tasksMap = new Map(column.tasks.map(t => [t._id, t]));
    column.taskOrder.forEach(taskId => {
        const task = tasksMap.get(taskId.toString());
        if (task) taskListEl.appendChild(createTaskCardElement(task));
    });
  }
  
  columnEl.appendChild(header);
  columnEl.appendChild(taskListEl);
  return columnEl;
}

function renderBoard(boardData) {
  currentProjectId = boardData._id; 
  document.getElementById('board-title').textContent = boardData.title;

  const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
  const ownerId = boardData.userOwner._id || boardData.userOwner;
  const adminIds = boardData.admins ? boardData.admins.map(a => a._id || a) : [];

  isUserAdminOrManager = (currentUser._id === ownerId) || adminIds.includes(currentUser._id);

  const btnAddColumn = document.getElementById('btn-add-column-header');
  if (btnAddColumn) {
      btnAddColumn.style.display = isUserAdminOrManager ? 'flex' : 'none';
  }
  
  if(boardContainer) {
      boardContainer.innerHTML = ''; 
      const columnsMap = new Map(boardData.columns.map(c => [c._id, c]));
      boardData.columnOrder.forEach(columnId => {
        const column = columnsMap.get(columnId.toString());
        if (column) boardContainer.appendChild(createColumnElement(column));
      });
  }

  // --- SỬA: RENDER HEADER MEMBERS (CHỈ CÒN ICON) ---
  const headerMembers = document.getElementById('board-header-members');
  if (headerMembers && boardData.members) {
      headerMembers.innerHTML = boardData.members.map(m => {
          return `
            <div class="header-member-item" draggable="true" data-id="${m._id}" 
                 style="cursor:grab; margin-right: -5px;" 
                 title="${m.username}">
                <img src="${m.avatar}" class="member-avatar-small" style="border: 2px solid #fff;">
            </div>`;
      }).join('');
      
      headerMembers.querySelectorAll('.header-member-item').forEach(item => {
          item.addEventListener('dragstart', (e) => {
              e.dataTransfer.setData("memberId", item.dataset.id);
          });
      });
  }

  if (boardData.members) {
      projectMembers = boardData.members;
      renderProjectMembers(boardData.members, boardData);
      initShareFeature(boardData._id, isUserAdminOrManager); 
  }
  
  checkOverdueNotification();
}

async function checkOverdueNotification() {
    try {
        const res = await fetch(`${API_BASE_URL}/tasks/overdue`, { 
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        if(res.ok) {
            const data = await res.json();
            if(data.tasks && data.tasks.length > 0) {
                toast.error(`Bạn có ${data.tasks.length} công việc đã quá hạn!`);
            }
        }
    } catch(e) { /* Ignore */ }
}

function initColumnDragAndDrop() {
  if (!boardContainer || !isUserAdminOrManager) return;
  new Sortable(boardContainer, {
    group: 'shared-columns',
    animation: 150,
    handle: '.column-header', 
    ghostClass: 'column-ghost',
    onEnd: function (evt) {
        const columnOrder = Array.from(boardContainer.children).map(col => col.getAttribute('data-column-id'));
        fetch(`${API_BASE_URL}/project/${currentProjectId}/columnorder`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
            body: JSON.stringify({ columnOrder })
        });
    }
  });
}

function initTaskDragAndDrop() {
  const taskLists = document.querySelectorAll('.task-list');
  taskLists.forEach(taskListEl => {
    if (taskListEl.sortableInstance) taskListEl.sortableInstance.destroy();

    taskListEl.sortableInstance = new Sortable(taskListEl, {
      group: 'shared-tasks', 
      animation: 150,
      ghostClass: 'task-ghost',
      disabled: !isUserAdminOrManager,
      sort: isUserAdminOrManager,
      onEnd: function (evt) {
        const itemEl = evt.item;
        const oldColumnList = evt.from;
        const newColumnList = evt.to;
        const taskId = itemEl.getAttribute('data-task-id');
        const oldColumnId = oldColumnList.getAttribute('data-column-id');
        const newColumnId = newColumnList.getAttribute('data-column-id');
        const taskOrderNew = Array.from(newColumnList.children).map(c => c.getAttribute('data-task-id'));
        const taskOrder = (oldColumnId === newColumnId) ? taskOrderNew : Array.from(oldColumnList.children).map(c => c.getAttribute('data-task-id'));
        
        fetch(`${API_BASE_URL}/column`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
            body: JSON.stringify({ idTask: taskId, idColumn: oldColumnId, idColumnNew: newColumnId, taskOrder, taskOrderNew })
        }).catch(err => toast.error("Lỗi cập nhật vị trí"));
      }
    });
  });
}

function initAddColumnButton() {
    const headerAddBtn = document.getElementById('btn-add-column-header');
    if (headerAddBtn && isUserAdminOrManager) {
        initColumnModal(currentProjectId, (newColumn) => {
            const newColumnEl = createColumnElement(newColumn);
            boardContainer.appendChild(newColumnEl);
            initTaskDragAndDrop(); 
            boardContainer.scrollTo({ left: boardContainer.scrollWidth, behavior: 'smooth' });
        });
        
        const newBtn = headerAddBtn.cloneNode(true);
        headerAddBtn.parentNode.replaceChild(newBtn, headerAddBtn);
        newBtn.addEventListener('click', () => openColumnModal());
    }
}

function handleTaskAdded(newTask, columnId) {
    const columnEl = document.querySelector(`.board-column[data-column-id="${columnId}"]`);
    if (!columnEl) return;
    const taskListEl = columnEl.querySelector('.task-list');
    taskListEl.appendChild(createTaskCardElement(newTask));
    const countEl = columnEl.querySelector('.task-count');
    if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    boardContainer = document.getElementById('board-content-container');

    if (!projectId) {
        toast.error("Không tìm thấy ID dự án!");
        setTimeout(() => window.location.href = '/src/pages/projects.html', 2000);
        return;
    }

    initProfileModal();
    initTaskModal(handleTaskAdded);
    initTaskDetailModal(); 
    
    fetch(`${API_BASE_URL}/project/${projectId}`)
        .then(res => {
            if(!res.ok) throw new Error("Dự án không tồn tại hoặc bạn không có quyền truy cập");
            return res.json();
        })
        .then(data => {
            if (data.project) {
                renderBoard(data.project);
                
                if(isUserAdminOrManager) initColumnDragAndDrop();
                
                initTaskDragAndDrop();
                initAddColumnButton();
            }
        })
        .catch(err => {
            console.error(err);
            toast.error(err.message);
        });
});