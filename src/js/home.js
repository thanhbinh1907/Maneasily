document.addEventListener('DOMContentLoaded', () => {
  const heroImage = document.querySelector('.hero-image');
  const featureBoxes = document.querySelectorAll('.feature-box');
  const featureImage = document.getElementById('feature-image');

  // Hiệu ứng xuất hiện ảnh hero khi cuộn đến
  const showOnScroll = () => {
    const rect = heroImage.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      heroImage.classList.add('visible');
      window.removeEventListener('scroll', showOnScroll);
    }
  };
  window.addEventListener('scroll', showOnScroll);
  showOnScroll();

  // Hiệu ứng đổi ảnh phần features
  featureBoxes.forEach(box => {
    box.addEventListener('mouseenter', () => {
      featureBoxes.forEach(b => b.classList.remove('active'));
      box.classList.add('active');

      const newImg = box.getAttribute('data-img');
      featureImage.style.opacity = 0;
      featureImage.style.transform = 'scale(0.97)';

      setTimeout(() => {
        featureImage.src = newImg;
        featureImage.onload = () => {
          featureImage.style.opacity = 1;
          featureImage.style.transform = 'scale(1)';
        };
      }, 250);
    });
  });
});
