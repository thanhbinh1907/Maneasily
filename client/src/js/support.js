document.addEventListener('DOMContentLoaded', () => {
    
    // Accordion Logic
    const accordions = document.querySelectorAll('.accordion-item');

    accordions.forEach(acc => {
        const header = acc.querySelector('.accordion-header');
        
        header.addEventListener('click', () => {
            // Tự động đóng các cái khác (Optional - nếu muốn chỉ mở 1 cái cùng lúc)
            /*
            accordions.forEach(otherAcc => {
                if (otherAcc !== acc) otherAcc.classList.remove('active');
            });
            */

            // Toggle cái hiện tại
            acc.classList.toggle('active');
        });
    });

    // Search Box Interaction (Giả lập)
    const searchInput = document.getElementById('support-search');
    const searchBtn = document.querySelector('.btn-search');

    const handleSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            // Trong thực tế sẽ chuyển hướng sang trang tìm kiếm
            alert(`Searching for: "${query}" (Feature coming soon!)`);
        }
    };

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

});