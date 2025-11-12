document.addEventListener('DOMContentLoaded', () => {

  // --- 1. Hiệu ứng Fade-in cho các mục khi cuộn ---
  const sections = document.querySelectorAll('.feature-section');

  const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Tùy chọn: Ngừng quan sát sau khi đã xuất hiện
        // fadeInObserver.unobserve(entry.target); 
      }
    });
  }, {
    threshold: 0.1 
  });

  sections.forEach(section => {
    fadeInObserver.observe(section);
  });

  // --- 2. Hiệu ứng Scrollspy cho Sidebar ---
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        sidebarLinks.forEach(link => {
          link.classList.remove('active-link');
        });

        const activeLink = document.querySelector(`.sidebar-link[href="#${id}"]`);
        if (activeLink) {
          activeLink.classList.add('active-link');
        }
      }
    });
  }, {
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  });

  sections.forEach(section => {
    sectionObserver.observe(section);
  });

  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault(); 
      
      const href = link.getAttribute('href');
      const targetElement = document.querySelector(href);
      
      if (targetElement) {
        const headerOffset = 100; 
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

});