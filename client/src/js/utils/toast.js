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
    error: (message) => show(message, 'error'),
    info: (message) => show(message, 'info')
};

function show(message, type) {
    const container = document.getElementById('toast-container');
    const toastEl = document.createElement('div');
    
    // Chọn icon phù hợp
    let icon = '';
    if (type === 'success') icon = '<i class="fa-solid fa-check-circle"></i>';
    else if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    else if (type === 'info') icon = '<i class="fa-solid fa-circle-info"></i>'; // <--- Icon cho Info

    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `${icon} <span>${message}</span>`;
    
    container.appendChild(toastEl);

    setTimeout(() => {
        toastEl.remove();
    }, 3000);
}