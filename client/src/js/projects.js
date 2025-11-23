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

    const user = JSON.parse(localStorage.getItem('maneasily_user'));
    if (!user) {
        window.location.href = '/src/pages/signin.html';
        return;
    }

    // --- Helper Modal ---
    const toggleModal = (modal, show) => modal.style.display = show ? 'flex' : 'none';

    // --- Event Listeners (Gom gọn) ---
    // 1. Mở/Đóng Modal Tạo
    createBtnHeader?.addEventListener('click', () => toggleModal(createModal, true));
    ['btn-close-create', 'btn-cancel-create'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => toggleModal(createModal, false));
    });

    // 2. Đóng Modal Xóa
    ['btn-close-delete', 'btn-cancel-delete'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => toggleModal(deleteModal, false));
    });

    window.addEventListener('click', (e) => {
        if (e.target === createModal) toggleModal(createModal, false);
        if (e.target === deleteModal) toggleModal(deleteModal, false);
    });

    // --- Functions ---
    async function loadProjects() {
        try {
            const res = await fetch(`${API_BASE_URL}/projects?userId=${user._id}`); // Dùng biến config
            const data = await res.json();
            renderProjects(data.projects || []);
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải danh sách dự án");
        }
    }

    function renderProjects(projects) {
        projectGrid.innerHTML = `
            <div class="project-card create-card" id="card-create-trigger">
                <i class="fa-solid fa-plus" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <span>Tạo dự án mới</span>
            </div>`;
        
        document.getElementById('card-create-trigger').addEventListener('click', () => toggleModal(createModal, true));

        projects.forEach(proj => {
            const html = `
                <div class="project-card-wrapper">
                    <a href="/src/pages/Board.html?id=${proj._id}" class="project-card" data-id="${proj._id}">
                        <div class="card-cover" style="background-image: url('${proj.img}');"></div>
                        <div class="card-body">
                            <h3>${proj.title}</h3>
                            <p style="font-size:0.8rem; color:#999">Admin: ${proj.userOwner?.username || 'N/A'}</p>
                        </div>
                    </a>
                    <button class="btn-delete-project" data-id="${proj._id}"><i class="fa-regular fa-trash-can"></i></button>
                </div>`;
            projectGrid.insertAdjacentHTML('beforeend', html);
        });

        // Gán sự kiện xóa
        document.querySelectorAll('.btn-delete-project').forEach(btn => {
            btn.addEventListener('click', () => {
                projectToDeleteId = btn.getAttribute('data-id');
                toggleModal(deleteModal, true);
            });
        });
        
        // Init Sortable (Giữ logic cũ nhưng rút gọn)
        // ... (Bạn có thể giữ lại code sortable cũ ở đây)
    }

    // --- Submit Create ---
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

    // --- Confirm Delete ---
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