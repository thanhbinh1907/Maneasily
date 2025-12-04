import { API_BASE_URL } from '../config.js';

export function initSearch() {
    const input = document.getElementById('global-search-input');
    const dropdown = document.getElementById('search-results-dropdown');
    let debounceTimer;

    // Nếu không tìm thấy element thì dừng ngay (tránh lỗi)
    if (!input || !dropdown) return;

    // Hàm gọi API
    const performSearch = async (keyword) => {
        try {
            const res = await fetch(`${API_BASE_URL}/search/global?q=${encodeURIComponent(keyword)}`, {
                headers: { 'Authorization': localStorage.getItem('maneasily_token') }
            });
            const data = await res.json();
            renderResults(data);
        } catch (err) {
            console.error("Lỗi tìm kiếm:", err);
        }
    };

    // Hàm hiển thị kết quả
    const renderResults = ({ projects, tasks }) => {
        dropdown.innerHTML = '';
        
        if ((!projects || projects.length === 0) && (!tasks || tasks.length === 0)) {
            dropdown.innerHTML = '<div style="padding:15px; text-align:center; color:var(--text-sub); font-size:0.9rem;">Không tìm thấy kết quả.</div>';
            dropdown.classList.add('show');
            return;
        }

        // Render Dự án
        if (projects.length > 0) {
            dropdown.innerHTML += `<div class="search-section-title">Dự án</div>`;
            projects.forEach(p => {
                dropdown.innerHTML += `
                    <a href="/src/pages/Board.html?id=${p._id}" class="search-result-item">
                        <img src="${p.img}" class="search-icon-box" style="object-fit:cover;">
                        <div class="search-info">
                            <h4>${p.title}</h4>
                        </div>
                    </a>`;
            });
        }

        // Render Công việc
        if (tasks.length > 0) {
            dropdown.innerHTML += `<div class="search-section-title">Công việc</div>`;
            tasks.forEach(t => {
                const link = `/src/pages/Board.html?id=${t.project._id}&openTask=${t._id}`;
                dropdown.innerHTML += `
                    <a href="${link}" class="search-result-item">
                        <div class="search-icon-box"><i class="fa-solid fa-check"></i></div>
                        <div class="search-info">
                            <h4>${t.title}</h4>
                            <p>Trong: ${t.project ? t.project.title : '...'}</p>
                        </div>
                    </a>`;
            });
        }

        dropdown.classList.add('show');
    };

    // Sự kiện nhập liệu (Debounce 300ms)
    input.addEventListener('input', (e) => {
        const keyword = e.target.value.trim();
        clearTimeout(debounceTimer);
        
        if (keyword.length < 2) {
            dropdown.classList.remove('show');
            return;
        }

        debounceTimer = setTimeout(() => {
            performSearch(keyword);
        }, 300);
    });

    // Đóng khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Mở lại khi focus
    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2 && dropdown.children.length > 0) {
            dropdown.classList.add('show');
        }
    });
}