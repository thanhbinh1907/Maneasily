// File: Maneasily/client/src/js/Board.js

import Sortable from 'sortablejs';

let currentProjectId = null;
let boardContainer = null; // Biến toàn cục cho board container

// --- HÀM RENDER (Giữ nguyên) ---
function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('data-task-id', task._id);
  card.innerHTML = `<p>${task.title}</p>`;
  card.addEventListener('click', () => {
    console.log('Clicked task:', task._id);
  });
  return card;
}

function createColumnElement(column) {
  const columnEl = document.createElement('div');
  columnEl.className = 'board-column';
  columnEl.setAttribute('data-column-id', column._id);

  const header = document.createElement('header');
  header.className = 'column-header';
  header.innerHTML = `
    <h2 class="column-title">${column.title}</h2>
    <button class="column-options-btn"><i class="fa-solid fa-ellipsis"></i></button>
  `;

  const taskListEl = document.createElement('div');
  taskListEl.className = 'task-list';
  taskListEl.setAttribute('data-column-id', column._id);

  if (column.tasks && column.taskOrder) { // Đảm bảo tasks/taskOrder tồn tại
    const tasksMap = new Map(column.tasks.map(t => [t._id, t]));
    column.taskOrder.forEach(taskId => {
        const task = tasksMap.get(taskId.toString());
        if (task) {
            const taskCard = createTaskCardElement(task);
            taskListEl.appendChild(taskCard);
        }
    });
  }
  
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

function renderBoard(boardData) {
  currentProjectId = boardData._id; 
  const boardTitleEl = document.getElementById('board-title');
  boardContainer = document.getElementById('board-content-container'); // Gán vào biến toàn cục
  
  boardTitleEl.textContent = boardData.title;
  boardContainer.innerHTML = ''; 

  const columnsMap = new Map(boardData.columns.map(c => [c._id, c]));
  boardData.columnOrder.forEach(columnId => {
    const column = columnsMap.get(columnId.toString());
    if (column) {
      const columnEl = createColumnElement(column);
      boardContainer.appendChild(columnEl);
    }
  });

  const addColumnBtn = document.createElement('button');
  addColumnBtn.className = 'btn-add-column';
  addColumnBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Thêm cột mới';
  boardContainer.appendChild(addColumnBtn);
}


// --- HÀM KÉO THẢ (ĐÃ TÁCH RA) ---

// Kích hoạt kéo thả cho CỘT
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

      fetch(`http://localhost:5000/api/project/${currentProjectId}/columnorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnOrder: columnOrder })
      })
      .then(res => res.json())
      .then(data => console.log(data.msg))
      .catch(err => console.error("Lỗi cập nhật cột:", err));
    }
  });
}

// Kích hoạt kéo thả cho TASK
function initTaskDragAndDrop() {
  const taskLists = document.querySelectorAll('.task-list');
  taskLists.forEach(taskListEl => {
    // Kiểm tra nếu đã init Sortable thì hủy đi
    if (taskListEl.sortableInstance) {
        taskListEl.sortableInstance.destroy();
    }

    // Tạo Sortable mới
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
        
        fetch('http://localhost:5000/api/column', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idTask: taskId, idColumn: oldColumnId, idColumnNew: newColumnId,
                taskOrder: taskOrder, taskOrderNew: taskOrderNew
            })
        })
        .then(res => res.json())
        .then(data => console.log(data.msg))
        .catch(err => console.error("Lỗi cập nhật task:", err));
      }
    });
  });
}


// --- (MỚI) HÀM KÍCH HOẠT CÁC NÚT "ADD" ---
function initAddButtons() {
    if (!boardContainer) return;

    // 1. Bắt sự kiện cho nút "Thêm công việc"
    boardContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-add-task')) {
            const title = prompt("Nhập tiêu đề cho công việc mới:");
            if (title) {
                const columnFooter = event.target.closest('.column-footer');
                const columnEl = columnFooter.closest('.board-column');
                const columnId = columnEl.getAttribute('data-column-id');
                const taskListEl = columnEl.querySelector('.task-list');

                // Gọi API để tạo Task
                fetch('http://localhost:5000/api/task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: title,
                        columnId: columnId,
                        projectId: currentProjectId
                    })
                })
                .then(res => res.json())
                .then(data => {
                    // Thêm task mới vào DOM
                    const newTaskCard = createTaskCardElement(data.task);
                    taskListEl.appendChild(newTaskCard);
                })
                .catch(err => console.error("Lỗi tạo task:", err));
            }
        }
    });

    // 2. Bắt sự kiện cho nút "Thêm cột mới"
    boardContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-add-column')) {
            const title = prompt("Nhập tiêu đề cho cột mới:");
            if (title) {
                const addColumnBtn = event.target;
                
                // Gọi API để tạo Column
                fetch('http://localhost:5000/api/column', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: title,
                        projectId: currentProjectId
                    })
                })
                .then(res => res.json())
                .then(data => {
                    // Thêm cột mới vào DOM (trước nút "Add column")
                    const newColumn = createColumnElement(data.column);
                    boardContainer.insertBefore(newColumn, addColumnBtn);
                    
                    // (Quan trọng) Kích hoạt lại kéo thả cho task list mới
                    initTaskDragAndDrop();
                })
                .catch(err => console.error("Lỗi tạo cột:", err));
            }
        }
    });
}

// --- KHỞI CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
    // THAY THẾ ID NÀY BẰNG PROJECT ID CỦA BẠN
    const PROJECT_ID_CUA_BAN = "6914b45e2241bff2bbb2d515"; // <-- THAY ID NÀY

    fetch(`http://localhost:5000/api/project/${PROJECT_ID_CUA_BAN}`)
        .then(response => response.json())
        .then(data => {
            if (data.project) {
                renderBoard(data.project);
                
                // Kích hoạt Kéo thả VÀ Nút Add
                initColumnDragAndDrop();
                initTaskDragAndDrop();
                initAddButtons(); // <-- HÀM MỚI
            } else {
                console.error("Lỗi: Không tìm thấy project từ API", data);
            }
        })
        .catch(error => {
            console.error('Lỗi khi fetch dữ liệu board:', error);
            document.getElementById('board-title').textContent = 'Không thể tải dự án';
        });
});