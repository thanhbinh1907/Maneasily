document.addEventListener('DOMContentLoaded', () => {
    // Hiệu ứng cho Job Cards
    const jobCards = document.querySelectorAll('.job-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    jobCards.forEach(card => observer.observe(card));
});