document.addEventListener('DOMContentLoaded', () => {
    // Hiệu ứng Fade-in cho các khối Social Hub
    const hubs = document.querySelectorAll('.hub-card');
    const events = document.querySelectorAll('.event-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Thêm class visible (bạn có thể style thêm trong CSS nếu muốn hiệu ứng trượt)
                // Ở đây mình tận dụng style opacity transition của hover để làm cho mượt
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Set trạng thái ban đầu cho animation
    const setInitialState = (el) => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    };

    hubs.forEach(setInitialState);
    events.forEach(setInitialState);
});