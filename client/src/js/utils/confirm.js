export function showConfirm(message, onConfirm) {
    // Kiểm tra nếu chưa có modal trong DOM thì chèn vào (Lazy load HTML)
    if (!document.getElementById('generic-confirm-modal')) {
        // (Cách này cần bạn nhúng {{> confirm-modal }} vào các trang, 
        //  hoặc dùng JS tạo element nếu lười sửa HTML. Ở đây ta giả sử đã nhúng).
        console.warn("Chưa nhúng confirm-modal vào HTML!");
        if(confirm(message)) onConfirm(); // Fallback về native nếu quên nhúng
        return;
    }

    const modal = document.getElementById('generic-confirm-modal');
    const msgEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('btn-generic-confirm');
    const cancelBtn = document.getElementById('btn-generic-cancel');

    // Set nội dung
    msgEl.textContent = message;
    modal.style.display = 'flex';

    // Xử lý sự kiện (Dùng clone để xóa event listener cũ tránh bị double click)
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Logic đóng
    const closeModal = () => modal.style.display = 'none';

    newCancelBtn.addEventListener('click', closeModal);
    
    newConfirmBtn.addEventListener('click', () => {
        closeModal();
        onConfirm(); // Gọi hàm callback khi user bấm Đồng ý
    });
}