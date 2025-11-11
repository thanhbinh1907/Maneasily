document.addEventListener('DOMContentLoaded', () => {

    // Lấy các phần tử (element) chính
    const mainContainer = document.getElementById('main-container');
    const toggleTask = document.getElementById('toggle-task');
    const toggleCalendar = document.getElementById('toggle-calendar');
    const toggleBoard = document.getElementById('toggle-board');

    const taskColumn = document.getElementById('task-column');
    const calendarColumn = document.getElementById('calendar-column');
    const boardColumn = document.getElementById('board-column');

    const taskResizer = document.querySelector('.resizer[data-prev-id="task-column"]');
    const calendarResizer = document.querySelector('.resizer[data-prev-id="calendar-column"]');

    const addListTrigger = document.querySelector('.add-list-trigger');
    const addListForm = document.querySelector('.add-list-form');
    const cancelListBtn = document.querySelector('.cancel-list-btn');
    const boardListsContainer = document.getElementById('board-lists');

    // --- HELPER FUNCTIONS ---
    /** Đếm số lượng cột đang hiển thị */
    function getVisibleColumnsCount() {
        let count = 0;
        if (!taskColumn.classList.contains('hidden')) count++;
        if (!calendarColumn.classList.contains('hidden')) count++;
        if (!boardColumn.classList.contains('hidden')) count++;
        return count;
    }

    // --- LOGIC ẨN/HIỆN CỘT VÀ TAB (TOÀN BỘ KHỐI ĐÃ CẬP NHẬT) ---

    /**
     * Logic bật/tắt cột DESKTOP. (ĐÃ SỬA LỖI ACTIVE STATE)
     */
    function toggleColumn(column, resizer, button) {
        const isHiding = !column.classList.contains('hidden');
        
        if (isHiding && getVisibleColumnsCount() <= 1) {
            console.warn("Không thể ẩn cột cuối cùng.");
            return false; // Báo thất bại
        }

        // Thực hiện toggle
        column.classList.toggle('hidden');
        
        if (resizer) {
            resizer.classList.toggle('hidden');
        }

        // FIX: Đồng bộ hóa trạng thái
        const isColumnNowHidden = column.classList.contains('hidden');
        if (isColumnNowHidden) {
            button.classList.remove('active'); // Cột ẩn -> nút KHÔNG active
        } else {
            button.classList.add('active'); // Cột hiện -> nút CÓ active
        }
        return true; // Báo thành công
    }

    const allColumns = [taskColumn, calendarColumn, boardColumn];
    const allToggleButtons = [toggleTask, toggleCalendar, toggleBoard];

    /**
     * Hiển thị một tab duy nhất trên MOBILE
     * @param {string} columnId (e.g., 'task-column')
     */
    function showMobileTab(columnId) {
        // 1. Cập nhật các Cột (Thêm/xóa class .mobile-active)
        allColumns.forEach(col => {
            col.classList.toggle('mobile-active', col.id === columnId);
        });

        // 2. Cập nhật các Nút (Thêm/xóa class .active)
        allToggleButtons.forEach(btn => {
            const btnName = btn.id.replace('toggle-', '');
            const colName = columnId.replace('-column', '');
            btn.classList.toggle('active', btnName === colName);
        });
    }

    // --- SỬA LẠI CÁC EVENT LISTENER ---
    // (Kết hợp logic Desktop/Mobile)

    toggleTask.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            showMobileTab('task-column');
        } else {
            toggleColumn(taskColumn, taskResizer, toggleTask);
        }
    });

    toggleCalendar.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            showMobileTab('calendar-column');
        } else {
            toggleColumn(calendarColumn, calendarResizer, toggleCalendar);
        }
    });

    toggleBoard.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            showMobileTab('board-column');
        } else {
            toggleColumn(boardColumn, null, toggleBoard); 
        }
    });

    // --- KHỞI TẠO TRẠNG THÁI KHI TẢI TRANG & RESIZE ---
    function initializeView() {
        if (window.innerWidth <= 768) {
            // --- Chế độ Mobile ---
            const activeBtn = document.querySelector('.app-footer button.active');
            let initialTab = 'board-column'; // Mặc định
            
            if (activeBtn && activeBtn.id.includes('toggle-')) {
                 initialTab = activeBtn.id.replace('toggle-', '') + '-column';
            }
            showMobileTab(initialTab); 
            
        } else {
            // --- Chế độ Desktop ---
            // Xóa class mobile-active
            allColumns.forEach(col => col.classList.remove('mobile-active'));
            
            // Đồng bộ lại class 'active' cho nút dựa trên trạng thái 'hidden' của cột
            allToggleButtons.forEach(btn => {
                let col;
                if (btn.id === 'toggle-task') col = taskColumn;
                if (btn.id === 'toggle-calendar') col = calendarColumn;
                if (btn.id === 'toggle-board') col = boardColumn;

                if (col) {
                    btn.classList.toggle('active', !col.classList.contains('hidden'));
                }
            });
        }
    }

    // Chạy khi tải trang
    initializeView();

    // Chạy khi resize (để xử lý chuyển đổi)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initializeView, 100);
    });
    
    // --- HẾT KHỐI LOGIC ẨN/HIỆN ---


    // --- 2. Chức năng Thêm Thẻ (Add Card) ---
    mainContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-card-trigger')) {
            const trigger = e.target;
            const form = trigger.nextElementSibling;
            form.style.display = 'block';
            trigger.style.display = 'none';
        }
        if (e.target.classList.contains('cancel-card-btn')) {
            const form = e.target.closest('.add-card-form');
            const trigger = form.previousElementSibling;
            form.style.display = 'none';
            trigger.style.display = 'block';
            form.reset();
        }
    });

    mainContainer.addEventListener('submit', (e) => {
        if (e.target.classList.contains('add-card-form')) {
            e.preventDefault();
            const form = e.target;
            const textarea = form.querySelector('textarea');
            const cardText = textarea.value.trim();

            if (cardText) {
                const cardList = form.closest('.board-column, .list').querySelector('.card-list');
                const newCard = createCard(cardText);
                cardList.appendChild(newCard);
                form.reset();
                form.style.display = 'none';
                form.previousElementSibling.style.display = 'block';
            }
        }
    });

    function createCard(text) {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        card.textContent = text;
        return card;
    }

    // --- 3. Chức năng Thêm Danh Sách (Add List) ---
    addListTrigger.addEventListener('click', () => {
        addListTrigger.style.display = 'none';
        addListForm.style.display = 'block';
        addListForm.querySelector('input').focus();
    });

    cancelListBtn.addEventListener('click', () => {
        addListTrigger.style.display = 'block';
        addListForm.style.display = 'none';
        addListForm.reset();
    });

    addListForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = addListForm.querySelector('input');
        const listTitle = input.value.trim();

        if (listTitle) {
            const newList = createList(listTitle);
            boardListsContainer.appendChild(newList);
            addListForm.reset();
            addListForm.style.display = 'none';
            addListTrigger.style.display = 'block';
        }
    });

    function createList(title) {
        const list = document.createElement('div');
        list.className = 'list';
        list.innerHTML = `
            <h4>${title}</h4>
            <div class="card-list">
            </div>
            <div class="add-card-container">
                <div class="add-card-trigger">Add a card</div>
                <form class="add-card-form">
                    <textarea placeholder="Enter card text..."></textarea>
                    <div class="form-controls">
                        <button type="submit">Create</button>
                        <button type="button" class="cancel-card-btn">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        return list;
    }
    
    // --- 4. Chức năng Kéo và Thả (Drag and Drop) ---
    let draggingCard = null;

    mainContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('card')) {
            draggingCard = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    mainContainer.addEventListener('dragend', (e) => {
        if (draggingCard) {
            draggingCard.classList.remove('dragging');
            draggingCard = null;
        }
    });

    mainContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    mainContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggingCard) {
            const dropZone = e.target.closest('.card-list');
            if (dropZone) {
                dropZone.appendChild(draggingCard);
            }
        }
    });

    // --- 5. Chức năng Resize Cột ---
    function initResizing() {
        let isResizing = false;
        let currentResizer = null;
        let prevColumn = null;
        let nextColumn = null;
        let startX = 0;
        let prevStartWidth = 0; 
        let nextStartWidth = 0; 

        mainContainer.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resizer')) {
                e.preventDefault();
                isResizing = true;
                currentResizer = e.target;
                
                const prevId = currentResizer.getAttribute('data-prev-id');
                prevColumn = document.getElementById(prevId);

                let nextEl = currentResizer.nextElementSibling;
                while (nextEl) {
                    if (nextEl.classList.contains('board-column') && !nextEl.classList.contains('hidden')) {
                        nextColumn = nextEl;
                        break;
                    }
                    nextEl = nextEl.nextElementSibling;
                }

                if (!prevColumn || !nextColumn) {
                    isResizing = false;
                    return;
                }

                startX = e.clientX;
                prevStartWidth = prevColumn.getBoundingClientRect().width;
                nextStartWidth = nextColumn.getBoundingClientRect().width;
                
                const allVisibleColumns = document.querySelectorAll('.board-column:not(.hidden)');
                allVisibleColumns.forEach(col => {
                    col.style.flexBasis = col.getBoundingClientRect().width + 'px';
                    col.style.flexGrow = '0';
                    col.style.flexShrink = '0';
                });
                
                currentResizer.classList.add('is-dragging');
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
            }
        });

        function handleMouseMove(e) {
            if (!isResizing) return;
            e.preventDefault(); 
            
            const dx = e.clientX - startX;
            const newPrevWidth = prevStartWidth + dx;
            const newNextWidth = nextStartWidth - dx;
            const minWidth = 100; 

            // Logic ẩn cột (khi kéo quá nhỏ)
            if (newPrevWidth < minWidth) {
                let toggleSuccess = false;
                if (prevColumn.id === 'task-column') {
                    toggleSuccess = toggleColumn(taskColumn, taskResizer, toggleTask);
                } else if (prevColumn.id === 'calendar-column') {
                    toggleSuccess = toggleColumn(calendarColumn, calendarResizer, toggleCalendar);
                }
                if (toggleSuccess) handleMouseUp();
                return; 
            }
            
            if (newNextWidth < minWidth) {
                let toggleSuccess = false;
                if (nextColumn.id === 'calendar-column') {
                    toggleSuccess = toggleColumn(calendarColumn, calendarResizer, toggleCalendar);
                } else if (nextColumn.id === 'board-column') {
                    toggleSuccess = toggleColumn(boardColumn, null, toggleBoard);
                }
                if (toggleSuccess) handleMouseUp();
                return; 
            }

            prevColumn.style.flexBasis = `${newPrevWidth}px`;
            nextColumn.style.flexBasis = `${newNextWidth}px`;
        }

        function handleMouseUp() {
            if (!isResizing) return;
            isResizing = false;
            
            if (currentResizer) {
                currentResizer.classList.remove('is-dragging');
            }
            
            const allColumns = document.querySelectorAll('.board-column');
            allColumns.forEach(col => {
                col.style.flexGrow = null;
                col.style.flexShrink = null;
            });
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            currentResizer = null;
            prevColumn = null;
            nextColumn = null;
            prevStartWidth = 0;
            nextStartWidth = 0;
        }   
    }
    
    initResizing();

    // --- 6. Chức năng Kéo Footer ---
    const draggableFooter = document.querySelector('.app-footer');
    let isDraggingFooter = false;
    let footerOffsetX = 0;
    let hasDragged = false; 

    draggableFooter.addEventListener('mousedown', (e) => {
        // Chỉ kéo nếu đang ở desktop
        if (window.innerWidth <= 768) {
             isDraggingFooter = false;
             return;
        }
        
        isDraggingFooter = true;
        hasDragged = false; 
        draggableFooter.classList.add('dragging');
        const rect = draggableFooter.getBoundingClientRect();
        
        if (getComputedStyle(draggableFooter).transform !== 'none') {
             draggableFooter.style.left = `${rect.left}px`;
             draggableFooter.style.transform = 'none';
        }
        footerOffsetX = e.clientX - rect.left;

        document.addEventListener('mousemove', onFooterMove);
        document.addEventListener('mouseup', onFooterUp);
    });

    function onFooterMove(e) {
        if (!isDraggingFooter) return;
        hasDragged = true; 
        e.preventDefault(); 

        let newLeft = e.clientX - footerOffsetX;
        const minLeft = 10; 
        const maxLeft = window.innerWidth - draggableFooter.offsetWidth - 10; 
        if (newLeft < minLeft) newLeft = minLeft;
        if (newLeft > maxLeft) newLeft = maxLeft;

        draggableFooter.style.left = `${newLeft}px`;
    }

    function onFooterUp() {
        if (!isDraggingFooter) return;
        isDraggingFooter = false;
        draggableFooter.classList.remove('dragging');
        document.removeEventListener('mousemove', onFooterMove);
        document.removeEventListener('mouseup', onFooterUp);
    }

    draggableFooter.addEventListener('click', (e) => {
        if (hasDragged) {
            e.stopPropagation(); 
            e.preventDefault();
        }
    }, true); 

});