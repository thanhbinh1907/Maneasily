document.addEventListener('DOMContentLoaded', () => {

  // --- Hiệu ứng Fade-in cho các thẻ khi cuộn ---
  const cards = document.querySelectorAll('.platform-card');

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeInObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1 
  });

  cards.forEach(card => {
    fadeInObserver.observe(card);
  });

});