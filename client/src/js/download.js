import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Logic Download (MỚI) ---
  const winBtn = document.getElementById('btn-download-windows');
  
  if (winBtn) {
      // Gán link API trực tiếp vào nút
      // Khi bấm, trình duyệt sẽ gọi API và file sẽ tự động tải về
      winBtn.href = `${API_BASE_URL}/download/windows`;
  }

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