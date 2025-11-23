import Sortable from 'sortablejs';
import { initProfileModal } from './components/profile-modal.js';
import { API_BASE_URL } from './config.js';
import { initShareFeature } from './components/share-modal.js';
import { toast } from './utils/toast.js'; // <-- Import mới

let currentProjectId = null;
let boardContainer = null; // Biến toàn cục cho board container

/* =========================================
   PHẦN 1: RENDER GIAO DIỆN (VIEW)
   ========================================= */

// 1. Tạo HTML cho thẻ Task
function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('data-task-id', task._id);
  card.innerHTML = `<p>${task.title}</p>`;
  
  // Sự kiện click vào task (để sau này làm chức năng sửa/xóa task)
  card.addEventListener('click', () => {
    console.log('Clicked task:', task._id);
    // TODO: Mở modal chi tiết task tại đây
  });
  return card;
}

// 2. Tạo HTML cho Cột (Column)
function createColumnElement(column) {
  const columnEl = document.createElement('div');
  columnEl.className = 'board-column'; 
  columnEl.setAttribute('data-column-id', column._id);

  // Header của cột
  const header = document.createElement('header');
  header.className = 'column-header';
  header.innerHTML = `
    <h2 class="column-title">${column.title}</h2>
    <button class="column-options-btn"><i class="fa-solid fa-ellipsis"></i></button>
  `;

  // Danh sách task bên trong
  const taskListEl = document.createElement('div');
  taskListEl.className = 'task-list';
  taskListEl.setAttribute('data-column-id', column._id);

  if (column.tasks && column.taskOrder) {
    const tasksMap = new Map(column.tasks.map(t => [t._id, t]));
    column.taskOrder.forEach(taskId => {
        const task = tasksMap.get(taskId.toString());
        if (task) {
            const taskCard = createTaskCardElement(task);
            taskListEl.appendChild(taskCard);
        }
    });
  }
  
  // Footer (Nút thêm task)
  const footer = document.createElement('footer');
  footer.className = 'column-footer';
  footer.innerHTML = `
    <button class="btn-add-task"><i class="fa-solid fa-plus"></i> Thêm công việc</button>
  `;
  
  columnEl.appendChild(header);
  columnEl.appendChild(taskListEl);
  columnEl.appendChild(footer);
  
  return columnEl;
}

// 3. Render toàn bộ Board
function renderBoard(boardData) {
  currentProjectId = boardData._id; 
  const boardTitleEl = document.getElementById('board-title');
  boardContainer = document.getElementById('board-content-container');
  
  // Cập nhật tiêu đề dự án
  if(boardTitleEl) boardTitleEl.textContent = boardData.title;

  // --- Render Thành viên trong Modal ---
  const memberListContainer = document.getElementById('project-members-list');
  if (memberListContainer) {
      if (boardData.members && boardData.members.length > 0) {
          memberListContainer.innerHTML = ''; 
          boardData.members.forEach(user => {
            const fallbackAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

            const item = document.createElement('div');
            item.className = 'user-result-item';
            item.style.cursor = 'default';
            item.innerHTML = `
                <img src="${user.avatar}" 
                     onerror="this.onerror=null; this.src='${fallbackAvatar}'"
                     class="result-avatar" 
                     style="background-color: #eee;">
                <div class="result-info">
                    <div>${user.username}</div>
                    <div style="font-size: 0.85rem; color: #666;">${user.email}</div>
                </div>
            `;
            memberListContainer.appendChild(item);  
          });
      } else {
          memberListContainer.innerHTML = '<p style="padding: 10px; color: #666;">Chưa có thành viên nào.</p>';
      }
  }

  // --- Render vào Header (Avatar nhỏ) ---
  const headerMembers = document.getElementById('board-header-members');
  if (headerMembers && boardData.members) {
      const fallbackAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

      headerMembers.innerHTML = boardData.members.map(m => 
          `<img src="${m.avatar}" 
                onerror="this.onerror=null; this.src='${fallbackAvatar}'" 
                class="member-avatar-small" 
                title="${m.username}" 
                style="width:30px; height:30px; border-radius:50%; border:2px solid white; margin-left:-8px; background-color: #fff; object-fit: cover;">`
      ).join('');
  }
  
  // --- Render Cột ---
  if(boardContainer) {
      boardContainer.innerHTML = ''; 
      const columnsMap = new Map(boardData.columns.map(c => [c._id, c]));
      
      boardData.columnOrder.forEach(columnId => {
        const column = columnsMap.get(columnId.toString());
        if (column) {
          const columnEl = createColumnElement(column);
          boardContainer.appendChild(columnEl);
        }
      });
  }
}

/* =========================================
   PHẦN 2: KÉO THẢ (DRAG & DROP)
   ========================================= */

// 1. Kéo thả CỘT
function initColumnDragAndDrop() {
  if (!boardContainer) return;
  new Sortable(boardContainer, {
    group: 'shared-columns',
    animation: 150,
    handle: '.column-header', 
    ghostClass: 'column-ghost',
    onEnd: function (evt) {
      if (!currentProjectId) return;
      const columnOrder = Array.from(boardContainer.children)
                               .filter(el => el.classList.contains('board-column'))
                               .map(col => col.getAttribute('data-column-id'));

      // Gọi API cập nhật vị trí cột (SỬA URL)
      fetch(`${API_BASE_URL}/project/${currentProjectId}/columnorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnOrder: columnOrder })
      })
      .then(res => {
          if(!res.ok) throw new Error('Lỗi server');
          return res.json();
      })
      .catch(err => {
          console.error("Lỗi cập nhật cột:", err);
          toast.error("Không thể lưu vị trí cột");
      });
    }
  });
}

// 2. Kéo thả TASK
function initTaskDragAndDrop() {
  const taskLists = document.querySelectorAll('.task-list');
  taskLists.forEach(taskListEl => {
    if (taskListEl.sortableInstance) {
        taskListEl.sortableInstance.destroy();
    }

    taskListEl.sortableInstance = new Sortable(taskListEl, {
      group: 'shared-tasks', 
      animation: 150,
      ghostClass: 'task-ghost',
      onEnd: function (evt) {
        const itemEl = evt.item;
        const oldColumnList = evt.from;
        const newColumnList = evt.to;

        const taskId = itemEl.getAttribute('data-task-id');
        const oldColumnId = oldColumnList.getAttribute('data-column-id');
        const newColumnId = newColumnList.getAttribute('data-column-id');

        const taskOrderNew = Array.from(newColumnList.children)
                                .map(card => card.getAttribute('data-task-id'));
        
        const taskOrder = (oldColumnId === newColumnId) 
                            ? taskOrderNew 
                            : Array.from(oldColumnList.children)
                                   .map(card => card.getAttribute('data-task-id'));
        
        // Gọi API cập nhật vị trí task (SỬA URL)
        fetch(`${API_BASE_URL}/column`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idTask: taskId, idColumn: oldColumnId, idColumnNew: newColumnId,
                taskOrder: taskOrder, taskOrderNew: taskOrderNew
            })
        })
        .then(res => {
            if(!res.ok) throw new Error('Lỗi server');
            return res.json();
        })
        .catch(err => {
            console.error("Lỗi cập nhật task:", err);
            toast.error("Không thể lưu vị trí công việc");
        });
      }
    });
  });
}


/* =========================================
   PHẦN 3: THÊM CỘT & THÊM TASK
   ========================================= */

function initAddButtons() {
    if (!boardContainer) return;

    // 1. Nút "Thêm công việc"
    boardContainer.addEventListener('click', function(event) {
        const btnAddTask = event.target.closest('.btn-add-task');
        if (btnAddTask) {
            const title = prompt("Nhập tên công việc:");
            if (title) {
                const columnFooter = btnAddTask.closest('.column-footer');
                const columnEl = columnFooter.closest('.board-column');
                const columnId = columnEl.getAttribute('data-column-id');
                const taskListEl = columnEl.querySelector('.task-list');

                // (SỬA URL)
                fetch(`${API_BASE_URL}/task`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: title,
                        columnId: columnId,
                        projectId: currentProjectId
                    })
                })
                .then(res => {
                    if (!res.ok) throw new Error("Lỗi tạo task");
                    return res.json();
                })
                .then(data => {
                    const newTaskCard = createTaskCardElement(data.task);
                    taskListEl.appendChild(newTaskCard);
                    toast.success("Đã thêm công việc mới");
                })
                .catch(err => {
                    console.error("Lỗi tạo task:", err);
                    toast.error("Lỗi khi tạo công việc");
                });
            }
        }
    });

    // 2. Nút "Thêm cột"
    const headerAddBtn = document.getElementById('btn-add-column-header');
    if (headerAddBtn) {
        const newBtn = headerAddBtn.cloneNode(true);
        headerAddBtn.parentNode.replaceChild(newBtn, headerAddBtn);

        newBtn.addEventListener('click', function() {
            const title = prompt("Nhập tên cột mới:");
            if (title) {
                // (SỬA URL)
                fetch(`${API_BASE_URL}/column`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: title,
                        projectId: currentProjectId
                    })
                })
                .then(res => {
                    if (!res.ok) throw new Error("Lỗi tạo cột");
                    return res.json();
                })
                .then(data => {
                    const newColumn = createColumnElement(data.column);
                    boardContainer.appendChild(newColumn);
                    initTaskDragAndDrop(); // Re-init sortable
                    boardContainer.scrollLeft = boardContainer.scrollWidth;
                    toast.success("Đã thêm cột mới");
                })
                .catch(err => {
                    console.error("Lỗi tạo cột:", err);
                    toast.error("Lỗi khi tạo cột");
                });
            }
        });
    }
}

/* =========================================
   PHẦN 5: KHỞI CHẠY (INIT)
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        // Thay alert bằng toast, và có thể chuyển trang nếu cần
        toast.error("Không tìm thấy ID dự án!");
        setTimeout(() => window.location.href = '/src/pages/projects.html', 2000);
        return;
    }

    initProfileModal();

    // (SỬA URL)
    fetch(`${API_BASE_URL}/project/${projectId}`)
        .then(res => {
            if(!res.ok) throw new Error("Không tìm thấy dự án");
            return res.json();
        })
        .then(data => {
            if (data.project) {
                currentProjectId = data.project._id;
                renderBoard(data.project);
                
                initColumnDragAndDrop();
                initTaskDragAndDrop();
                initAddButtons();
                
                initShareFeature(currentProjectId); 
            }
        })
        .catch(err => {
            console.error(err);
            toast.error("Lỗi tải dự án: " + err.message);
        });
});