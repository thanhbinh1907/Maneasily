import Sortable from 'sortablejs';
import { API_BASE_URL } from './config.js'; 
import { toast } from './utils/toast.js';   
import '../css/components/dashboard-layout.css'; 
import '../css/components/modal.css'; 

document.addEventListener('DOMContentLoaded', () => {
    const projectGrid = document.getElementById('project-sortable-list');
    const createBtnHeader = document.getElementById('btn-create-project');
    
    // Modal Elements
    const createModal = document.getElementById('create-project-modal');
    const deleteModal = document.getElementById('delete-project-modal');
    const createForm = document.getElementById('create-project-form');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    
    let projectToDeleteId = null;

    let user = JSON.parse(localStorage.getItem('maneasily_user'));
    if (!user) {
        window.location.href = '/src/pages/signin.html';
        return;
    }

    const toggleModal = (modal, show) => modal.style.display = show ? 'flex' : 'none';

    createBtnHeader?.addEventListener('click', () => toggleModal(createModal, true));
    ['btn-close-create', 'btn-cancel-create'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => toggleModal(createModal, false));
    });
    ['btn-close-delete', 'btn-cancel-delete'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => toggleModal(deleteModal, false));
    });

    window.addEventListener('click', (e) => {
        if (e.target === createModal) toggleModal(createModal, false);
        if (e.target === deleteModal) toggleModal(deleteModal, false);
    });

    async function loadProjects() {
        try {
            user = JSON.parse(localStorage.getItem('maneasily_user'));
            const res = await fetch(`${API_BASE_URL}/projects?userId=${user._id}`);
            const data = await res.json();
            
            let projects = data.projects || [];
            
            // [FIX] Lấy danh sách ghim từ projectSettings (thay vì activitySettings)
            const pinnedIds = user.projectSettings?.pinnedProjects || [];

            // Sắp xếp: Pinned lên đầu
            projects.sort((a, b) => {
                const isPinnedA = pinnedIds.includes(a._id);
                const isPinnedB = pinnedIds.includes(b._id);
                
                if (isPinnedA && !isPinnedB) return -1;
                if (!isPinnedA && isPinnedB) return 1;
                return 0;
            });

            renderProjects(projects, pinnedIds);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách dự án");
        }
    }

    function renderProjects(projects, pinnedIds) {
        projectGrid.innerHTML = `
            <div class="project-card create-card" id="card-create-trigger">
                <i class="fa-solid fa-plus" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <span>Tạo dự án mới</span>
            </div>`;
        
        document.getElementById('card-create-trigger').addEventListener('click', () => toggleModal(createModal, true));

        projects.forEach(proj => {
            const isPinned = pinnedIds.includes(proj._id);
            const starClass = isPinned ? 'fa-solid' : 'fa-regular';
            const starColor = isPinned ? 'color: #ffab00;' : '';

            const html = `
                <div class="project-card-wrapper">
                    <a href="/src/pages/Board.html?id=${proj._id}" class="project-card" data-id="${proj._id}">
                        <div class="card-cover" style="background-image: url('${proj.img}');"></div>
                        <div class="card-body">
                            <h3>${proj.title}</h3>
                            <p style="font-size:0.8rem; color: var(--text-sub)">Admin: ${proj.userOwner?.username || 'N/A'}</p>
                        </div>
                    </a>
                    
                    <button class="btn-action-project btn-pin-project" data-id="${proj._id}" title="${isPinned ? 'Bỏ ghim' : 'Ghim dự án'}">
                        <i class="${starClass} fa-star" style="${starColor}"></i>
                    </button>

                    <button class="btn-action-project btn-delete-project" data-id="${proj._id}" title="Xóa dự án">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>`;
            projectGrid.insertAdjacentHTML('beforeend', html);
        });

        document.querySelectorAll('.btn-delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                projectToDeleteId = btn.getAttribute('data-id');
                toggleModal(deleteModal, true);
            });
        });

        document.querySelectorAll('.btn-pin-project').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const projectId = btn.getAttribute('data-id');
                await togglePinProject(projectId);
            });
        });
    }

    async function togglePinProject(projectId) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/pin`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token')
                },
                body: JSON.stringify({ projectId })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.msg);
                
                // [FIX] Cập nhật projectSettings vào LocalStorage
                // Giữ nguyên activitySettings cũ, chỉ update projectSettings
                if (!user.projectSettings) user.projectSettings = {};
                user.projectSettings.pinnedProjects = data.pinnedProjects;
                
                localStorage.setItem('maneasily_user', JSON.stringify(user));
                loadProjects(); 
            } else {
                toast.error(data.err);
            }
        } catch (e) { console.error(e); toast.error("Lỗi kết nối"); }
    }

    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = createForm.querySelector('.btn-submit');
        const originalText = btn.innerText;
        btn.innerText = "Đang xử lý..."; btn.disabled = true;

        try {
            const body = {
                title: document.getElementById('p-title').value,
                dec: document.getElementById('p-dec').value,
                img: document.getElementById('p-img').value,
                userId: user._id
            };
            
            const res = await fetch(`${API_BASE_URL}/project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (res.ok) {
                toast.success("Tạo dự án thành công!");
                toggleModal(createModal, false);
                createForm.reset();
                loadProjects();
            } else {
                const d = await res.json();
                toast.error(d.err || "Lỗi tạo dự án");
            }
        } catch (err) {
            toast.error("Lỗi kết nối server");
        } finally {
            btn.innerText = originalText; btn.disabled = false;
        }
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if(!projectToDeleteId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/project/${projectToDeleteId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                toast.success("Đã xóa dự án!");
                toggleModal(deleteModal, false);
                loadProjects();
            } else {
                toast.error("Lỗi khi xóa");
            }
        } catch (e) { toast.error("Lỗi server"); }
    });

    loadProjects();
});