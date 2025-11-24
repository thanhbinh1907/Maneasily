import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';

let activeColumnId = null;
let activeProjectId = null;
let onSuccessCallback = null;

export function initTaskModal(onSuccess) {
    onSuccessCallback = onSuccess;
    const modal = document.getElementById('add-task-modal');
    const closeBtn = document.getElementById('close-add-task');
    const form = document.getElementById('form-add-task');

    const closeModal = () => modal.style.display = 'none';
    
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!activeColumnId || !activeProjectId) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerText = "Đang thêm..."; submitBtn.disabled = true;

        const title = document.getElementById('task-title').value;
        const dec = document.getElementById('task-desc').value;
        const tag = document.getElementById('task-tag').value;
        const colorEl = document.querySelector('input[name="taskColor"]:checked');
        const color = colorEl ? colorEl.value : '#00c2e0';

        try {
            const token = localStorage.getItem('maneasily_token'); // 1. Lấy token

            const res = await fetch(`${API_BASE_URL}/task`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token 
                },
                body: JSON.stringify({ title, dec, tag, color, columnId: activeColumnId, projectId: activeProjectId })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Đã thêm nhiệm vụ!");
                closeModal();
                if (onSuccessCallback) onSuccessCallback(data.task, activeColumnId);
            } else {
                toast.error(data.err || "Lỗi tạo task");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi kết nối server");
        } finally {
            submitBtn.innerText = "Thêm nhiệm vụ"; submitBtn.disabled = false;
        }
    });
}

export function openTaskModal(columnId, projectId) {
    activeColumnId = columnId;
    activeProjectId = projectId;
    const modal = document.getElementById('add-task-modal');
    const form = document.getElementById('form-add-task');
    if (modal && form) {
        form.reset();
        modal.style.display = 'flex';
        setTimeout(() => document.getElementById('task-title')?.focus(), 100);
    }
}