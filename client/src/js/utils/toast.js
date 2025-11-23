// Tự động chèn container vào body nếu chưa có
if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
}

// Import CSS (Vite sẽ tự xử lý)
import '../../css/components/toast.css';

export const toast = {
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error')
};

function show(message, type) {
    const container = document.getElementById('toast-container');
    const toastEl = document.createElement('div');
    
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(toastEl);

    // Tự động xóa sau 3s
    setTimeout(() => {
        toastEl.remove();
    }, 3000);
}