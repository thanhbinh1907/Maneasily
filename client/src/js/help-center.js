document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Category Navigation (Menu trái) ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.category-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active cũ
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            // Active mới
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Scroll lên đầu content (cho mobile)
            if (window.innerWidth <= 800) {
                document.getElementById('main-content-area').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 2. Article Expansion (Accordion) ---
    // Sử dụng Event Delegation để tối ưu hiệu năng
    const contentArea = document.getElementById('main-content-area');

    contentArea.addEventListener('click', (e) => {
        // Kiểm tra xem click có trúng header bài viết không
        const header = e.target.closest('.article-header');
        if (header) {
            const articleItem = header.parentElement;
            
            // Toggle class open
            articleItem.classList.toggle('open');
        }
    });

    // --- 3. Search Logic (Simple Filter) ---
    const searchInput = document.getElementById('help-search-input');
    const clearBtn = document.getElementById('btn-clear-search');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if(query.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');

        const allArticles = document.querySelectorAll('.article-item');
        let hasResult = false;

        allArticles.forEach(article => {
            const text = article.innerText.toLowerCase();
            // Nếu tìm thấy, mở danh mục cha và hiển thị bài viết
            if (text.includes(query)) {
                article.style.display = 'block';
                // Mở accordion ra luôn để user thấy nội dung khớp
                if (!article.classList.contains('open')) article.classList.add('open');
                
                // Đảm bảo section cha hiển thị (logic này hơi phức tạp nếu muốn ẩn tab khác, 
                // ở đây ta chỉ ẩn bài viết không khớp trong tab hiện tại hoặc hiện tất cả nếu muốn search global)
                // Để đơn giản: Ta chỉ lọc hiển thị/ẩn bài viết. 
                // Người dùng nên chọn đúng Tab hoặc ta cần logic phức tạp hơn để switch tab tự động.
            } else {
                article.style.display = 'none';
                article.classList.remove('open');
            }
        });
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.add('hidden');
        // Reset lại hiển thị
        document.querySelectorAll('.article-item').forEach(item => {
            item.style.display = 'block';
            item.classList.remove('open');
        });
    });

});