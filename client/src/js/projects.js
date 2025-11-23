// File: Maneasily/client/src/js/projects.js

import Sortable from 'sortablejs';
import '../css/components/dashboard-layout.css'; 

document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN ---
    const projectGrid = document.getElementById('project-sortable-list');
    const createBtnHeader = document.getElementById('btn-create-project');
    
    // Modal Tạo
    const createModal = document.getElementById('create-project-modal');
    const closeCreateBtn = document.getElementById('btn-close-modal');
    const cancelCreateBtn = document.getElementById('btn-cancel-modal');
    const createForm = document.getElementById('create-project-form');

    // Modal Xóa (MỚI)
    const deleteModal = document.getElementById('delete-project-modal');
    const closeDeleteBtn = document.getElementById('btn-close-delete-modal');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    
    let projectToDeleteId = null; // Biến lưu ID dự án đang chọn xóa

    // User info
    const userStr = localStorage.getItem('maneasily_user');
    if (!userStr) {
        alert("Vui lòng đăng nhập!");
        window.location.href = '/src/pages/signin.html';
        return;
    }
    const user = JSON.parse(userStr);

    // --- 1. HÀM XỬ LÝ MODAL (CHUNG) ---
    function openModal(modal) {
        modal.style.display = 'flex';
    }
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Sự kiện Modal TẠO
    if(createBtnHeader) createBtnHeader.addEventListener('click', () => {
        openModal(createModal);
        document.getElementById('p-title').focus();
    });
    if(closeCreateBtn) closeCreateBtn.addEventListener('click', () => closeModal(createModal));
    if(cancelCreateBtn) cancelCreateBtn.addEventListener('click', () => closeModal(createModal));

    // Sự kiện Modal XÓA (Đóng/Hủy)
    if(closeDeleteBtn) closeDeleteBtn.addEventListener('click', () => closeModal(deleteModal));
    if(cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => closeModal(deleteModal));

    // Đóng khi click ra ngoài
    window.addEventListener('click', (e) => {
        if (e.target === createModal) closeModal(createModal);
        if (e.target === deleteModal) closeModal(deleteModal);
    });


    // --- 2. LOGIC TẢI DỰ ÁN ---
    async function loadProjects() {
        try {
            const res = await fetch(`http://localhost:5000/api/projects?userId=${user._id}`);
            const data = await res.json();
            if (data.projects) {
                renderProjects(data.projects);
            }
        } catch (err) {
            console.error("Lỗi tải dự án:", err);
        }
    }

    function renderProjects(projects) {
        projectGrid.innerHTML = `
            <div class="project-card create-card" id="card-create-trigger">
                <i class="fa-solid fa-plus" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <span>Tạo dự án mới</span>
            </div>
        `;
        document.getElementById('card-create-trigger').addEventListener('click', () => openModal(createModal));

        projects.forEach(proj => {
            const bgImg = proj.img || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500";
            
            // HTML Card Dự Án
            const html = `
                <div class="project-card-wrapper" style="position: relative;">
                    <a href="/src/pages/Board.html?id=${proj._id}" class="project-card" data-id="${proj._id}">
                        <div class="card-cover" style="background-image: url('${bgImg}');"></div>
                        <div class="card-body">
                            <h3>${proj.title}</h3>
                            <p style="font-size: 0.85rem; color: #6b778c; margin-bottom: 5px;">
                                ${proj.dec ? (proj.dec.length > 50 ? proj.dec.substring(0,50)+'...' : proj.dec) : ''}
                            </p>
                            <p style="font-size: 0.8rem; color: #999;">Admin: ${user.username}</p>
                        </div>
                    </a>
                    <button class="btn-delete-project" data-id="${proj._id}" title="Xóa dự án">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            projectGrid.insertAdjacentHTML('beforeend', html);
        });

        // Gán sự kiện click cho các nút xóa (Mở Modal Xóa)
        const deleteButtons = document.querySelectorAll('.btn-delete-project');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                
                // Lưu ID vào biến tạm và mở modal
                projectToDeleteId = btn.getAttribute('data-id');
                openModal(deleteModal);
            });
        });

        // Init Sortable (Giữ nguyên)
        if (!projectGrid.sortableInstance) {
            projectGrid.sortableInstance = new Sortable(projectGrid, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                filter: '.create-card',
                onMove: function (evt) { return evt.related.className.indexOf('create-card') === -1; },
                onEnd: async function (evt) {
                    const newOrder = Array.from(projectGrid.querySelectorAll('.project-card[data-id]')).map(el => el.getAttribute('data-id'));
                    try {
                        await fetch('http://localhost:5000/api/projects/order', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user._id, projectOrder: newOrder })
                        });
                    } catch (err) { console.error(err); }
                }
            });
        }
    }

    // --- 3. XỬ LÝ NÚT "XÁC NHẬN XÓA" TRONG MODAL ---
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!projectToDeleteId) return;

        // Hiệu ứng loading cho nút xóa
        const originalText = confirmDeleteBtn.textContent;
        confirmDeleteBtn.textContent = "Đang xóa...";
        confirmDeleteBtn.disabled = true;

        try {
            const res = await fetch(`http://localhost:5000/api/project/${projectToDeleteId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                closeModal(deleteModal); // Đóng modal
                loadProjects();          // Tải lại danh sách
                projectToDeleteId = null; // Reset ID
            } else {
                const data = await res.json();
                alert("Lỗi xóa: " + data.err);
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server");
        } finally {
            confirmDeleteBtn.textContent = originalText;
            confirmDeleteBtn.disabled = false;
        }
    });

    // --- 4. XỬ LÝ SUBMIT FORM TẠO DỰ ÁN (Giữ nguyên) ---
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('p-title').value.trim();
        const dec = document.getElementById('p-dec').value.trim();
        const img = document.getElementById('p-img').value.trim();

        if (!title) return;

        const submitBtn = createForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Đang tạo...";
        submitBtn.disabled = true;

        try {
            const res = await fetch('http://localhost:5000/api/project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, dec, img, userId: user._id })
            });
            const data = await res.json();
            if (data.project) {
                closeModal(createModal);
                loadProjects();
            } else {
                alert("Lỗi: " + (data.err || "Không tạo được dự án"));
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi kết nối server");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Chạy lần đầu
    loadProjects();
});