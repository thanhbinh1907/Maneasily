import Sortable from 'sortablejs';
import { initProfileModal } from './components/profile-modal.js';
import { API_BASE_URL, SOCKET_URL } from './config.js'; // Import
import { initShareFeature, renderProjectMembers } from './components/share-modal.js';
import { toast } from './utils/toast.js';
import { initTaskModal, openTaskModal } from './components/task-modal.js';
import { initColumnModal, openColumnModal } from './components/column-modal.js';
import { showConfirm } from './utils/confirm.js';
import { initTaskDetailModal, openTaskDetail } from './components/task-detail/index.js';
import { io } from "socket.io-client";
import { initSearch } from './components/search.js'; 
import { t } from './utils/i18n.js'; // [MỚI] Import

let currentProjectId = null;
let boardContainer = null;
let isUserAdminOrManager = false;
let projectMembers = [];
let socket = null;
let socketDebounceTimer = null;

/* =========================================
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
    
    // --- [LOGIC MỚI: XỬ LÝ TRẠNG THÁI & MÀU VIỀN] ---
    // 1. Kiểm tra hoàn thành: Có subtask VÀ tất cả đều xong
    const isAllWorksDone = task.works && task.works.length > 0 && task.works.every(w => w.isDone);
    
    // 2. Kiểm tra quá hạn
    const isLate = isTaskOverdue(task.deadline);
  
    // 3. Xét màu viền (Ưu tiên: Xanh -> Đỏ)
    if (isAllWorksDone) {
        card.style.borderLeft = "4px solid #2e8b57"; // Xanh lá (Đã xong)
    } else if (isLate) {
        card.style.borderLeft = "4px solid #d93025"; // Đỏ (Quá hạn)
    }
    // ------------------------------------------------
  
    // Render Tag
    const tagColor = task.color || '#00c2e0';
    const tagHTML = task.tag ? `<div class="task-tag" style="background-color: ${tagColor};">${task.tag}</div>` : '';
    
    // Render Mô tả ngắn
    const descHTML = task.dec ? `<div class="task-desc">${task.dec}</div>` : '';
  
    // Render Thành viên
    let membersHTML = '';
    if (task.members && task.members.length > 0) {
        membersHTML = task.members.map(u => 
            `<img src="${u.avatar}" title="${u.username}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid #fff; margin-right: -8px;">`
        ).join('');
    }
  
    // Render Nút xóa (chỉ cho Admin/Manager)
    let deleteBtnHTML = '';
    if (isUserAdminOrManager) {
        deleteBtnHTML = `<i class="fa-regular fa-trash-can btn-delete-task" title="Xóa công việc" style="cursor: pointer; color: #d93025; font-size: 0.9rem; opacity: 0.6; transition: opacity 0.2s;"></i>`;
    }
  
    // Icon đồng hồ (Màu đỏ nếu quá hạn & chưa xong)
    const clockIconColor = (!isAllWorksDone && isLate) ? 'color:#d93025' : '';
    const deadlineHTML = task.deadline ? `<i class="fa-regular fa-clock" style="${clockIconColor}"></i>` : '';
  
    // Gắn HTML vào thẻ
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
              ${deadlineHTML}
          </div>
      </div>
    `;
  
    // --- XỬ LÝ SỰ KIỆN ---
    
    // 1. Sự kiện cho Admin (Xóa, Drag & Drop visual)
    if (isUserAdminOrManager) {
        const delBtn = card.querySelector('.btn-delete-task');
        
        // Hiệu ứng hover nút xóa
        delBtn.addEventListener('mouseenter', () => delBtn.style.opacity = '1');
        delBtn.addEventListener('mouseleave', () => delBtn.style.opacity = '0.6');
        
        // Xử lý xóa
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
  
        // Hiệu ứng khi kéo thả đè lên
        card.addEventListener('dragover', (e) => { e.preventDefault(); card.style.backgroundColor = "#ebecf0"; });
        card.addEventListener('dragleave', () => { card.style.backgroundColor = "#fff"; });
        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            card.style.backgroundColor = "#fff";
        });
    }
  
    // 2. Sự kiện mở chi tiết (Click vào card)
    card.addEventListener('click', (e) => {
        // Nếu click vào nút xóa thì không mở modal
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
          showConfirm(`${t('modal.confirm')} delete "${column.title}"?`, async () => {
              try {
                  const res = await fetch(`${API_BASE_URL}/column/${column._id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': localStorage.getItem('maneasily_token') }
                  });
                  if (res.ok) {
                      columnEl.remove();
                      toast.success(t('msg.deleted_success') || "Deleted successfully");
                  } else {
                      const d = await res.json();
                      toast.error(d.err || "Error");
                  }
              } catch (err) { toast.error("Server error"); }
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
      if (isUserAdminOrManager) {
          btnAddColumn.style.display = 'flex';
          btnAddColumn.onclick = () => openColumnModal();
      } else {
          btnAddColumn.style.display = 'none';
      }
  }

  // --- XỬ LÝ NÚT GHIM (STAR) ---
  const starBtn = document.querySelector('.btn-star');
  const starIcon = starBtn.querySelector('i');
  
  // Lấy danh sách ghim từ projectSettings
  const pinnedList = currentUser.projectSettings?.pinnedProjects || [];
  const isPinned = pinnedList.includes(currentProjectId);

  if (isPinned) {
      starIcon.classList.remove('fa-regular');
      starIcon.classList.add('fa-solid');
      starIcon.style.color = '#ffab00';
  } else {
      starIcon.classList.remove('fa-solid');
      starIcon.classList.add('fa-regular');
      starIcon.style.color = '';
  }

  const newStarBtn = starBtn.cloneNode(true);
  starBtn.parentNode.replaceChild(newStarBtn, starBtn);

  newStarBtn.addEventListener('click', async () => {
      try {
          const res = await fetch(`${API_BASE_URL}/users/pin`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': localStorage.getItem('maneasily_token')
              },
              body: JSON.stringify({ projectId: currentProjectId })
          });
          const data = await res.json();

          if (res.ok) {
              toast.success(data.msg);
              
              if (data.isPinned) {
                  newStarBtn.querySelector('i').classList.replace('fa-regular', 'fa-solid');
                  newStarBtn.querySelector('i').style.color = '#ffab00';
              } else {
                  newStarBtn.querySelector('i').classList.replace('fa-solid', 'fa-regular');
                  newStarBtn.querySelector('i').style.color = '';
              }

              if (!currentUser.projectSettings) currentUser.projectSettings = {};
              currentUser.projectSettings.pinnedProjects = data.pinnedProjects;
              
              localStorage.setItem('maneasily_user', JSON.stringify(currentUser));

          } else {
              toast.error(data.err || "Lỗi cập nhật ghim");
          }
      } catch (e) {
          console.error(e);
          toast.error("Lỗi kết nối server");
      }
  });

  if(boardContainer) {
      boardContainer.innerHTML = ''; 
      const columnsMap = new Map(boardData.columns.map(c => [c._id, c]));
      boardData.columnOrder.forEach(columnId => {
        const column = columnsMap.get(columnId.toString());
        if (column) boardContainer.appendChild(createColumnElement(column));
      });
  }

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
}

async function checkOverdueNotification() {
    try {
        const res = await fetch(`${API_BASE_URL}/tasks/overdue`, { 
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        if(res.ok) {
            const data = await res.json();
            if(data.tasks && data.tasks.length > 0) {
                // [DỊCH] Thông báo có n task quá hạn
                const msg = t('task.msg_global_overdue').replace('{n}', data.tasks.length);
                toast.error(msg);
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
        
        forceFallback: true,              
        fallbackClass: 'sortable-fallback', 

        disabled: !isUserAdminOrManager,
        sort: isUserAdminOrManager,
        onEnd: function (evt) {
          const itemEl = evt.item;
          const oldColumnList = evt.from;
          const newColumnList = evt.to;
          
          const oldColEl = oldColumnList.closest('.board-column');
          const newColEl = newColumnList.closest('.board-column');
          
          if (oldColEl) {
              const countEl = oldColEl.querySelector('.task-count');
              if (countEl) countEl.textContent = oldColumnList.children.length;
          }
          if (newColEl) {
              const countEl = newColEl.querySelector('.task-count');
              if (countEl) countEl.textContent = newColumnList.children.length;
          }
  
          const taskId = itemEl.getAttribute('data-task-id');
          const oldColumnId = oldColumnList.getAttribute('data-column-id');
          const newColumnId = newColumnList.getAttribute('data-column-id');
          const taskOrderNew = Array.from(newColumnList.children).map(c => c.getAttribute('data-task-id'));
          const taskOrder = (oldColumnId === newColumnId) ? taskOrderNew : Array.from(oldColumnList.children).map(c => c.getAttribute('data-task-id'));
          
          fetch(`${API_BASE_URL}/column`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('maneasily_token') },
              body: JSON.stringify({ idTask: taskId, idColumn: oldColumnId, idColumnNew: newColumnId, taskOrder, taskOrderNew })
          }).catch(err => {
              toast.error("Lỗi cập nhật vị trí");
              fetchAndRenderBoard(currentProjectId);
          });
        }
      });
    });
}

function handleTaskAdded(newTask, columnId) {
    const columnEl = document.querySelector(`.board-column[data-column-id="${columnId}"]`);
    if (!columnEl) return;
    const taskListEl = columnEl.querySelector('.task-list');
    taskListEl.appendChild(createTaskCardElement(newTask));
    const countEl = columnEl.querySelector('.task-count');
    if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
}

function handleColumnAdded(newColumn) {
    const newColumnEl = createColumnElement(newColumn);
    boardContainer.appendChild(newColumnEl);
    initTaskDragAndDrop(); 
    boardContainer.scrollTo({ left: boardContainer.scrollWidth, behavior: 'smooth' });
}

// --- HÀM TẢI DỮ LIỆU ---
async function fetchAndRenderBoard(projectId) {
    try {
        const res = await fetch(`${API_BASE_URL}/project/${projectId}`);
        if(!res.ok) throw new Error("Không thể tải dự án");
        
        const data = await res.json();
        if (data.project) {
            renderBoard(data.project);
            
            if(isUserAdminOrManager) {
                initColumnDragAndDrop();
                initTaskDragAndDrop(); 
            }
        }
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    boardContainer = document.getElementById('board-content-container');

    if (!projectId) {
        toast.error("Không tìm thấy ID dự án!");
        setTimeout(() => window.location.href = '/src/pages/projects.html', 2000);
        return;
    }

    currentProjectId = projectId; 

    // --- 1. KẾT NỐI SOCKET ---
    socket = io(SOCKET_URL);
        
    socket.on('connect', () => {
        console.log("⚡ Đã kết nối Socket, đang vào phòng:", projectId);
        socket.emit('joinBoard', projectId);
    });

    socket.on('boardUpdated', (data) => {
        const currentUser = JSON.parse(localStorage.getItem('maneasily_user'));
        
        if (currentUser && data.updaterId === currentUser._id) {
            return;
        }

        console.log("⚡ Nhận tín hiệu update:", data); 

        if (socketDebounceTimer) clearTimeout(socketDebounceTimer);
        socketDebounceTimer = setTimeout(() => {
            fetchAndRenderBoard(projectId);
        }, 200); 
    });

    // --- 2. KHỞI TẠO CÁC MODAL ---
    initProfileModal();
    initTaskModal(handleTaskAdded); 
    initTaskDetailModal(); 
    
    initColumnModal(projectId, handleColumnAdded); 
    initSearch(); // [MỚI] Khởi tạo tìm kiếm cho trang Board
    
    // --- 3. TẢI DỮ LIỆU LẦN ĐẦU ---
    await fetchAndRenderBoard(projectId);
    checkOverdueNotification();

    // --- DEEP LINKING: Tự động mở task nếu có param 'openTask' ---
    const openTaskId = params.get('openTask');
    if (openTaskId) {
        // Xóa param khỏi URL
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + projectId;
        window.history.replaceState({path:newUrl}, '', newUrl);
        
        // Mở modal (delay nhẹ để đảm bảo DOM render)
        setTimeout(() => {
            openTaskDetail(openTaskId, isUserAdminOrManager, projectMembers);
        }, 500); 
    }
});