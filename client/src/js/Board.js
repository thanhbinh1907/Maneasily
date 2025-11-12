// File: Maneasily/src/js/Board.js

import Sortable from 'sortablejs';

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

  // Quan trọng: Dữ liệu trả về từ populate() đã là object đầy đủ,
  // không cần `tasksMap` nữa, nhưng chúng ta vẫn cần sắp xếp.
  const tasksMap = new Map(column.tasks.map(t => [t._id, t]));
  column.taskOrder.forEach(taskId => {
    // taskId ở đây có thể là string hoặc object, 
    // nhưng `populate` trong projectCtrl đã xử lý nó
    // Tuy nhiên, project WQLCV lưu ID trong taskOrder
    const task = tasksMap.get(taskId.toString()); // Đảm bảo an toàn
    if (task) {
      const taskCard = createTaskCardElement(task);
      taskListEl.appendChild(taskCard);
    }
  });
  
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
  const boardTitleEl = document.getElementById('board-title');
  const boardContainer = document.getElementById('board-content-container');
  
  boardTitleEl.textContent = boardData.title;
  boardContainer.innerHTML = ''; 

  // Quan trọng: Dữ liệu trả về từ populate() đã là object đầy đủ
  const columnsMap = new Map(boardData.columns.map(c => [c._id, c]));
  boardData.columnOrder.forEach(columnId => {
    const column = columnsMap.get(columnId.toString()); // Đảm bảo an toàn
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


// --- HÀM KÉO THẢ (Giữ nguyên) ---

function initDragAndDrop() {
  const taskLists = document.querySelectorAll('.task-list');
  taskLists.forEach(taskListEl => {
    new Sortable(taskListEl, {
      group: 'shared-tasks',
      animation: 150,
      ghostClass: 'task-ghost',
      onEnd: function (evt) {
        const itemEl = evt.item;
        const toColumnList = evt.to;
        const oldColumnId = evt.from.getAttribute('data-column-id');
        const newColumnId = toColumnList.getAttribute('data-column-id');
        const taskId = itemEl.getAttribute('data-task-id');
        
        console.log(`DI CHUYỂN TASK: ${taskId} từ ${oldColumnId} đến ${newColumnId}`);
        
        // TODO: (Bước 4) Gọi API 'fetch' (PATCH) để cập nhật CSDL
      }
    });
  });

  const boardContainer = document.getElementById('board-content-container');
  new Sortable(boardContainer, {
    group: 'shared-columns',
    animation: 150,
    handle: '.column-header',
    ghostClass: 'column-ghost',
    onEnd: function (evt) {
      const columnId = evt.item.getAttribute('data-column-id');
      console.log(`DI CHUYỂN CỘT: ${columnId} đến vị trí ${evt.newIndex}`);
      
      // TODO: (Bước 4) Gọi API 'fetch' (PATCH) để cập nhật CSDL
    }
  });
}


// --- KHỞI CHẠY KHI TẢI TRANG (ĐÃ CẬP NHẬT) ---

document.addEventListener('DOMContentLoaded', () => {
    // THAY THẾ ID NÀY BẰNG PROJECT ID CỦA BẠN
    const PROJECT_ID_CUA_BAN = "6914b45e2241bff2bbb2d515"; // <-- THAY ID NÀY

    // 1. Gọi API để lấy dữ liệu thật
    // Logic này mô phỏng theo `useEffect` trong WQLCV
    fetch(`http://localhost:5000/api/project/${PROJECT_ID_CUA_BAN}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.project) {
                // 2. Render board với dữ liệu THẬT
                renderBoard(data.project);
                
                // 3. Kích hoạt kéo thả SAU KHI render
                initDragAndDrop();
            } else {
                console.error("Lỗi: Không tìm thấy project từ API", data);
            }
        })
        .catch(error => {
            console.error('Lỗi khi fetch dữ liệu board:', error);
            // Hiển thị lỗi cho người dùng nếu cần
            document.getElementById('board-title').textContent = 'Không thể tải dự án';
        });
});