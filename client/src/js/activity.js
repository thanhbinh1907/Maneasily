// File: Maneasily/client/src/js/activity.js
import Sortable from 'sortablejs';
import { API_BASE_URL } from './config.js';
import { toast } from './utils/toast.js';

let allProjectsData = [];
let pinnedProjectIds = [];

document.addEventListener('DOMContentLoaded', () => {
    loadActivityBoard();
});

async function loadActivityBoard() {
    const container = document.getElementById('activity-board-list');
    container.innerHTML = '<p>Đang tải hoạt động...</p>';

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
    const container = document.getElementById('activity-board-list');
    container.innerHTML = '';

    allProjectsData.forEach(item => {
        const isPinned = pinnedProjectIds.includes(item.project._id);
        const card = document.createElement('div');
        card.className = `activity-project-card ${isPinned ? 'pinned' : ''}`;
        card.setAttribute('data-id', item.project._id);

        card.innerHTML = `
            <div class="card-header">
                <h3>
                    <img src="${item.project.img}" class="project-icon">
                    ${item.project.title}
                </h3>
                <div class="card-actions">
                    <button class="btn-action btn-pin ${isPinned ? 'active' : ''}" title="Ghim">
                        <i class="fa-solid fa-thumbtack"></i>
                    </button>
                </div>
            </div>
            <div class="logs-preview">
                ${renderLogs(item.activities)}
            </div>
            <div class="card-footer">
                <button class="btn-zoom"><i class="fa-solid fa-expand"></i> Xem chi tiết</button>
            </div>
        `;

        // Event: Ghim
        card.querySelector('.btn-pin').addEventListener('click', () => togglePin(item.project._id));
        
        // Event: Zoom
        card.querySelector('.btn-zoom').addEventListener('click', () => openZoomModal(item));

        container.appendChild(card);
    });

    // Kích hoạt kéo thả
    new Sortable(container, {
        animation: 150,
        handle: '.card-header', // Chỉ kéo được khi nắm vào header
        ghostClass: 'sortable-ghost',
        onEnd: saveOrder // Lưu thứ tự sau khi thả
    });
}

function renderLogs(logs) {
    if(!logs || logs.length === 0) return '<p style="text-align:center; color:#999;">Chưa có hoạt động.</p>';
    
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
    // Map action key sang tiếng Việt hoặc format đẹp
    // Bạn cần quy ước các key action ở backend (VD: 'create_task', 'join_project')
    const map = {
        'create_task': 'đã tạo công việc',
        'update_task': 'đã cập nhật',
        'delete_task': 'đã xóa',
        'add_member': 'đã thêm thành viên',
        // ...
    };
    return map[log.action] || log.action;
}

// --- LOGIC GHIM ---
async function togglePin(projectId) {
    if (pinnedProjectIds.includes(projectId)) {
        pinnedProjectIds = pinnedProjectIds.filter(id => id !== projectId);
    } else {
        pinnedProjectIds.push(projectId);
    }
    // Reload UI tạm thời (logic sort lại nằm ở renderBoard nếu muốn client tự sort, 
    // hoặc gọi server sort. Ở đây ta gọi saveOrder để server lưu và reload)
    await saveOrder(); 
    loadActivityBoard(); // Reload để server sort lại đúng vị trí
}

// --- LOGIC LƯU THỨ TỰ ---
async function saveOrder() {
    const container = document.getElementById('activity-board-list');
    const projectOrder = Array.from(container.children).map(el => el.getAttribute('data-id'));

    try {
        await fetch(`${API_BASE_URL}/activity/preferences`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('maneasily_token')
            },
            body: JSON.stringify({ pinnedProjects: pinnedProjectIds, projectOrder })
        });
    } catch (e) { console.error("Lỗi lưu sắp xếp", e); }
}

// --- LOGIC ZOOM MODAL ---
const modal = document.getElementById('activity-zoom-modal');
const closeBtn = document.getElementById('close-zoom-modal');
let currentZoomProjectId = null;
let currentZoomSkip = 0;

function openZoomModal(item) {
    document.getElementById('zoom-project-title').textContent = item.project.title;
    const list = document.getElementById('zoom-logs-list');
    list.innerHTML = renderLogs(item.activities); // Render 20 cái đầu
    
    currentZoomProjectId = item.project._id;
    currentZoomSkip = 20;
    
    // Thêm nút "Tải thêm" nếu cần
    if(item.activities.length >= 20) {
        const btnMore = document.createElement('button');
        btnMore.className = 'btn-zoom'; 
        btnMore.textContent = 'Tải thêm hoạt động cũ hơn...';
        btnMore.onclick = loadMoreLogs;
        list.appendChild(btnMore);
    }

    modal.style.display = 'flex';
}

async function loadMoreLogs(e) {
    const btn = e.target;
    btn.textContent = 'Đang tải...';
    
    try {
        const res = await fetch(`${API_BASE_URL}/activity/logs?projectId=${currentZoomProjectId}&skip=${currentZoomSkip}`, {
            headers: { 'Authorization': localStorage.getItem('maneasily_token') }
        });
        const data = await res.json();
        
        if(data.activities.length > 0) {
            btn.remove(); // Xóa nút cũ
            const list = document.getElementById('zoom-logs-list');
            const html = renderLogs(data.activities);
            list.insertAdjacentHTML('beforeend', html); // Thêm log mới xuống dưới
            
            currentZoomSkip += 20;
            // Thêm lại nút nếu còn
            if(data.activities.length >= 20) {
                const newBtn = document.createElement('button');
                newBtn.className = 'btn-zoom'; 
                newBtn.textContent = 'Tải thêm...';
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