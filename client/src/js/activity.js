import Sortable from 'sortablejs';
import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';
import { t } from './utils/i18n.js'; // [MỚI] Import hàm dịch

let allProjectsData = [];
let pinnedProjectIds = [];

document.addEventListener('DOMContentLoaded', () => {
    loadActivityBoard();
});

async function loadActivityBoard() {
    const container = document.getElementById('other-list');
    // [MỚI] Dịch text đang tải
    container.innerHTML = `<p>${t('dash.loading')}</p>`;

    try {
        const res = await fetch(`${API_BASE_URL}/activity/dashboard`, {
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const data = await res.json();
        
        allProjectsData = data.boardData;
        pinnedProjectIds = data.pinnedIds;
        
        renderBoard();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Lỗi tải dữ liệu.</p>';
    }
}

function renderBoard() {
    const pinnedContainer = document.getElementById('pinned-list');
    const otherContainer = document.getElementById('other-list');
    const pinnedSection = document.getElementById('pinned-section');

    pinnedContainer.innerHTML = '';
    otherContainer.innerHTML = '';

    const pinnedItems = [];
    const otherItems = [];

    allProjectsData.forEach(item => {
        if (pinnedProjectIds.includes(item.project._id)) {
            pinnedItems.push(item);
        } else {
            otherItems.push(item);
        }
    });

    // 1. Render Pinned List
    if (pinnedItems.length > 0) {
        pinnedSection.style.display = 'block';
        pinnedItems.forEach(item => {
            pinnedContainer.appendChild(createCardElement(item, true));
        });
    } else {
        pinnedSection.style.display = 'none';
    }

    // 2. Render Other List
    if (otherItems.length > 0) {
        otherItems.forEach(item => {
            otherContainer.appendChild(createCardElement(item, false));
        });
    } else {
        // [MỚI] Dịch text không có dự án
        otherContainer.innerHTML = `<p style="color:#888; padding:10px;">${t('dash.no_project')}</p>`;
    }

    // 3. Khởi tạo Sortable
    new Sortable(pinnedContainer, {
        group: 'pinned',
        animation: 150,
        handle: '.card-header',
        ghostClass: 'sortable-ghost',
        onEnd: saveOrder
    });

    new Sortable(otherContainer, {
        group: 'others',
        animation: 150,
        handle: '.card-header',
        ghostClass: 'sortable-ghost',
        onEnd: saveOrder
    });
}

function createCardElement(item, isPinned) {
    const card = document.createElement('div');
    card.className = `activity-project-card ${isPinned ? 'pinned' : ''}`;
    card.setAttribute('data-id', item.project._id);

    // [MỚI] Dịch tooltip và nút Xem chi tiết
    card.innerHTML = `
        <div class="card-header">
            <h3>
                <img src="${item.project.img}" class="project-icon">
                ${item.project.title}
            </h3>
            <div class="card-actions">
                <button class="btn-action btn-pin ${isPinned ? 'active' : ''}" title="${isPinned ? 'Unpin' : 'Pin'}">
                    <i class="fa-solid fa-thumbtack"></i>
                </button>
            </div>
        </div>
        <div class="logs-preview">
            ${renderLogs(item.activities)}
        </div>
        <div class="card-footer">
            <button class="btn-zoom"><i class="fa-solid fa-expand"></i> ${t('dash.view_more')}</button>
        </div>
    `;

    card.querySelector('.btn-pin').addEventListener('click', () => togglePin(item.project._id));
    card.querySelector('.btn-zoom').addEventListener('click', () => openZoomModal(item));

    return card;
}

function renderLogs(logs) {
    // [MỚI] Dịch text không có hoạt động
    if(!logs || logs.length === 0) return `<p style="text-align:center; color:#999;">${t('dash.no_activity')}</p>`;
    
    return logs.map(log => `
        <div class="log-item">
            <img src="${log.user.avatar}" class="log-avatar">
            <div class="log-content">
                <span class="highlight">${log.user.username}</span> 
                ${getActionText(log)} 
                <span class="highlight">${log.target || ''}</span>
                <span class="log-time">${new Date(log.createdAt).toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

function getActionText(log) {
    // Nếu bạn muốn dịch cả hành động (action) từ server, bạn cần thêm map ở đây
    // Ví dụ: server trả về "created task", bạn dùng t('action.created_task')
    // Hiện tại giữ nguyên text từ server nếu chưa có key dịch
    return log.action;
}

async function togglePin(projectId) {
    if (pinnedProjectIds.includes(projectId)) {
        pinnedProjectIds = pinnedProjectIds.filter(id => id !== projectId);
    } else {
        pinnedProjectIds.push(projectId);
    }
    await saveOrder(); 
    loadActivityBoard();
}

async function saveOrder() {
    const pinnedContainer = document.getElementById('pinned-list');
    const otherContainer = document.getElementById('other-list');

    const pinnedOrder = Array.from(pinnedContainer.children).map(el => el.getAttribute('data-id'));
    const otherOrder = Array.from(otherContainer.children).map(el => el.getAttribute('data-id'));
    const fullProjectOrder = [...pinnedOrder, ...otherOrder];

    try {
        await fetch(`${API_BASE_URL}/activity/preferences`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('maneasily_token')
            },
            body: JSON.stringify({ pinnedProjects: pinnedProjectIds, projectOrder: fullProjectOrder })
        });
    } catch (e) { console.error("Lỗi lưu sắp xếp", e); }
}

const modal = document.getElementById('activity-zoom-modal');
const closeBtn = document.getElementById('close-zoom-modal');
let currentZoomProjectId = null;
let currentZoomSkip = 0;

function openZoomModal(item) {
    document.getElementById('zoom-project-title').textContent = item.project.title;
    const list = document.getElementById('zoom-logs-list');
    list.innerHTML = renderLogs(item.activities); 
    
    currentZoomProjectId = item.project._id;
    currentZoomSkip = 5;
    
    if(item.activities.length >= 5) {
        const btnMore = document.createElement('button');
        btnMore.className = 'btn-zoom'; 
        btnMore.textContent = t('dash.view_more') + '...'; // Dịch nút tải thêm
        btnMore.onclick = loadMoreLogs;
        list.appendChild(btnMore);
    }

    modal.style.display = 'flex';
}

async function loadMoreLogs(e) {
    const btn = e.target;
    btn.textContent = t('dash.loading'); // Dịch loading
    
    try {
        const res = await fetch(`${API_BASE_URL}/activity/logs?projectId=${currentZoomProjectId}&skip=${currentZoomSkip}`, {
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const data = await res.json();
        
        if(data.activities.length > 0) {
            btn.remove(); 
            const list = document.getElementById('zoom-logs-list');
            const html = renderLogs(data.activities);
            list.insertAdjacentHTML('beforeend', html);
            
            currentZoomSkip += 20;
            if(data.activities.length >= 20) {
                const newBtn = document.createElement('button');
                newBtn.className = 'btn-zoom'; 
                newBtn.textContent = t('dash.view_more');
                newBtn.onclick = loadMoreLogs;
                list.appendChild(newBtn);
            }
        } else {
            btn.textContent = 'Đã hết hoạt động.';
            btn.disabled = true;
        }
    } catch(err) { toast.error("Lỗi tải thêm"); }
}

closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if(e.target == modal) modal.style.display = 'none'; }