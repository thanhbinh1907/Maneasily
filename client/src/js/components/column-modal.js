import { API_BASE_URL } from '../config.js';
import { toast } from '../utils/toast.js';

let currentProjectId = null;
let onSuccessCallback = null;

export function initColumnModal(projectId, onSuccess) {
    currentProjectId = projectId;
    onSuccessCallback = onSuccess;

    const modal = document.getElementById('add-column-modal');
    const form = document.getElementById('form-add-column');
    const closeBtn = document.getElementById('close-add-column');
    const cancelBtn = document.getElementById('cancel-add-column');
    const input = document.getElementById('column-title-input');

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    // Gắn sự kiện đóng
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Xử lý submit
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = input.value.trim();
        if (!title) return;

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "Đang tạo..."; btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/column`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('maneasily_token')
                },
                body: JSON.stringify({ title, projectId: currentProjectId })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Đã thêm cột mới!");
                closeModal();
                if (onSuccessCallback) onSuccessCallback(data.column);
            } else {
                toast.error(data.err || "Lỗi tạo cột");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi kết nối server");
        } finally {
            btn.innerText = originalText; btn.disabled = false;
        }
    });
}

export function openColumnModal() {
    const modal = document.getElementById('add-column-modal');
    const input = document.getElementById('column-title-input');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => input?.focus(), 100);
    }
}