// File: Maneasily/client/src/js/Board.js

import Sortable from 'sortablejs';

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
  });
  return card;
}

// 2. Tạo HTML cho Cột (Column)
function createColumnElement(column) {
  const columnEl = document.createElement('div');
  columnEl.className = 'board-column'; // Class này đã set width cứng trong CSS
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
  
  // Xóa nội dung cũ và vẽ lại
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
    handle: '.column-header', // Chỉ kéo được khi nắm vào header
    ghostClass: 'column-ghost',
    onEnd: function (evt) {
      if (!currentProjectId) return;
      const columnOrder = Array.from(boardContainer.children)
                               .filter(el => el.classList.contains('board-column'))
                               .map(col => col.getAttribute('data-column-id'));

      // Gọi API cập nhật vị trí cột
      fetch(`http://localhost:5000/api/project/${currentProjectId}/columnorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnOrder: columnOrder })
      })
      .then(res => res.json())
      .then(data => console.log("Đã lưu vị trí cột"))
      .catch(err => console.error("Lỗi cập nhật cột:", err));
    }
  });
}

// 2. Kéo thả TASK
function initTaskDragAndDrop() {
  const taskLists = document.querySelectorAll('.task-list');
  taskLists.forEach(taskListEl => {
    // Hủy instance cũ để tránh lỗi đè
    if (taskListEl.sortableInstance) {
        taskListEl.sortableInstance.destroy();
    }

    taskListEl.sortableInstance = new Sortable(taskListEl, {
      group: 'shared-tasks', // Cho phép kéo qua lại giữa các cột
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
        
        // Gọi API cập nhật vị trí task
        fetch('http://localhost:5000/api/column', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idTask: taskId, idColumn: oldColumnId, idColumnNew: newColumnId,
                taskOrder: taskOrder, taskOrderNew: taskOrderNew
            })
        })
        .then(res => res.json())
        .then(data => console.log("Đã lưu vị trí task"))
        .catch(err => console.error("Lỗi cập nhật task:", err));
      }
    });
  });
}


/* =========================================
   PHẦN 3: THÊM CỘT & THÊM TASK
   ========================================= */

function initAddButtons() {
    if (!boardContainer) return;

    // 1. Nút "Thêm công việc" (Nằm trong mỗi cột)
    boardContainer.addEventListener('click', function(event) {
        const btnAddTask = event.target.closest('.btn-add-task');
        if (btnAddTask) {
            const title = prompt("Nhập tên công việc:");
            if (title) {
                const columnFooter = btnAddTask.closest('.column-footer');
                const columnEl = columnFooter.closest('.board-column');
                const columnId = columnEl.getAttribute('data-column-id');
                const taskListEl = columnEl.querySelector('.task-list');

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
                    const newTaskCard = createTaskCardElement(data.task);
                    taskListEl.appendChild(newTaskCard);
                })
                .catch(err => console.error("Lỗi tạo task:", err));
            }
        }
    });

    // 2. Nút "Thêm cột" (Nằm trên Header)
    const headerAddBtn = document.getElementById('btn-add-column-header');
    if (headerAddBtn) {
        // Clone nút để xóa event cũ (tránh duplicate)
        const newBtn = headerAddBtn.cloneNode(true);
        headerAddBtn.parentNode.replaceChild(newBtn, headerAddBtn);

        newBtn.addEventListener('click', function() {
            const title = prompt("Nhập tên cột mới:");
            if (title) {
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
                    const newColumn = createColumnElement(data.column);
                    boardContainer.appendChild(newColumn);
                    
                    // Kích hoạt lại kéo thả cho cột mới
                    initTaskDragAndDrop();
                    
                    // Cuộn sang phải để thấy cột mới
                    boardContainer.scrollLeft = boardContainer.scrollWidth;
                })
                .catch(err => console.error("Lỗi tạo cột:", err));
            }
        });
    }
}


/* =========================================
   PHẦN 4: CHIA SẺ DỰ ÁN (SHARE FEATURE)
   ========================================= */

function initShareFeature() {
    const shareBtn = document.getElementById('btn-manage-members');
    const modal = document.getElementById('share-modal');
    const closeBtn = document.getElementById('close-share-modal');
    const searchInput = document.getElementById('user-search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    
    // Xử lý Tabs (nếu có dùng tabs)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- UI Modal ---
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            if(searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            if(dropdown) dropdown.style.display = 'none';
            
            // Set link copy nếu có
            const linkInput = document.getElementById('share-link-input');
            if(linkInput) linkInput.value = window.location.href;
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Xử lý chuyển Tab
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if(targetContent) targetContent.classList.add('active');
        });
    });

    // --- Logic Tìm kiếm (Debounce) ---
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            clearTimeout(debounceTimer);
            
            if (keyword.length < 2) {
                if(dropdown) dropdown.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                const token = localStorage.getItem('maneasily_token');
                try {
                    const res = await fetch(`http://localhost:5000/api/users/search?q=${keyword}`, {
                        headers: { 'Authorization': token }
                    });
                    const data = await res.json();
                    renderSearchResults(data.users);
                } catch (err) {
                    console.error("Lỗi tìm kiếm:", err);
                }
            }, 300); // Chờ 300ms
        });
    }

    // Render kết quả tìm kiếm
    function renderSearchResults(users) {
        if (!dropdown) return;
        dropdown.innerHTML = '';

        if (!users || users.length === 0) {
            dropdown.style.display = 'block';
            dropdown.innerHTML = '<div style="padding:10px; text-align:center; color:#666;">Không tìm thấy người dùng.</div>';
            return;
        }

        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-result-item';
            item.innerHTML = `
                <img src="${user.avatar || 'https://www.gravatar.com/avatar/default?d=mp'}" class="result-avatar">
                <div class="result-info">
                    <div>${user.username}</div>
                    <div>${user.email}</div>
                </div>
            `;
            // Click để thêm thành viên
            item.addEventListener('click', () => addUserToProject(user));
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    // Gọi API thêm thành viên
    async function addUserToProject(userToAdd) {
        if (!confirm(`Thêm ${userToAdd.username} vào dự án này?`)) return;

        const token = localStorage.getItem('maneasily_token');
        try {
            const res = await fetch('http://localhost:5000/api/users/add-member', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ 
                    projectId: currentProjectId,
                    userId: userToAdd._id 
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Đã thêm thành công!");
                dropdown.style.display = 'none';
                searchInput.value = '';
            } else {
                alert("Lỗi: " + data.err);
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server.");
        }
    }

    // Logic Copy Link
    const btnCopy = document.getElementById('btn-copy-link');
    if(btnCopy) {
        btnCopy.addEventListener('click', () => {
            const copyText = document.getElementById("share-link-input");
            if(copyText) {
                copyText.select();
                navigator.clipboard.writeText(copyText.value);
                alert("Đã sao chép liên kết!");
            }
        });
    }
}


/* =========================================
   PHẦN 5: KHỞI CHẠY (INIT)
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Lấy ID từ URL
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        alert("Không tìm thấy ID dự án!");
        return;
    }

    // Gọi API lấy dữ liệu dự án
    fetch(`http://localhost:5000/api/project/${projectId}`)
        .then(response => response.json())
        .then(data => {
            if (data.project) {
                renderBoard(data.project);
                
                // Khởi tạo các module chức năng
                initColumnDragAndDrop();
                initTaskDragAndDrop();
                initAddButtons();
                initShareFeature(); // Kích hoạt tính năng Share
            } else {
                console.error("Lỗi: Không tìm thấy project", data);
                document.getElementById('board-title').textContent = 'Dự án không tồn tại';
            }
        })
        .catch(error => {
            console.error('Lỗi kết nối:', error);
            document.getElementById('board-title').textContent = 'Lỗi tải dữ liệu';
        });
});