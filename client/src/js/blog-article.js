document.addEventListener('DOMContentLoaded', () => {

  // --- Hiệu ứng Fade-in cho các thẻ khi cuộn ---
  const cards = document.querySelectorAll('.article-card');

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Ngừng quan sát sau khi đã xuất hiện
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1 // Xuất hiện khi 10% thẻ được nhìn thấy
  });

  // Quan sát tất cả các thẻ
  cards.forEach(card => {
    fadeInObserver.observe(card);
  });

});