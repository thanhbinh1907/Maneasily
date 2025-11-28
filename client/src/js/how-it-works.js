document.addEventListener('DOMContentLoaded', () => {
    // Sử dụng IntersectionObserver để phát hiện khi phần tử vào khung hình
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Ngừng quan sát sau khi đã hiện (chạy 1 lần)
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2 // Kích hoạt khi 20% phần tử xuất hiện
    });

    const stepRows = document.querySelectorAll('.step-row');
    stepRows.forEach(row => {
        observer.observe(row);
    });
});