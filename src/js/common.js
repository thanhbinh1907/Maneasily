document.addEventListener('DOMContentLoaded', () => {
  // Logic cho Hamburger Menu
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const nav = document.querySelector('header nav, .sticky-header nav');

  if (mobileNavToggle && nav) {
    mobileNavToggle.addEventListener('click', () => {
      nav.classList.toggle('nav-visible');
      
      // Đổi icon (từ 'bars' sang 'times' và ngược lại)
      const icon = mobileNavToggle.querySelector('i');
      if (nav.classList.contains('nav-visible')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  }
});