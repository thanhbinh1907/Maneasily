import { API_BASE_URL } from '../../config.js'; // Lùi 2 cấp thư mục
import { toast } from '../../utils/toast.js';   // Lùi 2 cấp thư mục

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': localStorage.getItem('maneasily_token')
});

export const TaskAPI = {
    getDetail: async (taskId) => {
        const res = await fetch(`${API_BASE_URL}/task/${taskId}`, { headers: getHeaders() });
        return res.json();
    },

    update: async (taskId, body) => {
        const res = await fetch(`${API_BASE_URL}/task/${taskId}`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify(body)
        });
        return res.json();
    },

    delete: async (taskId) => {
        const res = await fetch(`${API_BASE_URL}/task/${taskId}`, {
            method: 'DELETE', headers: getHeaders()
        });
        return res.ok;
    },

    addSubtask: async (title, taskId) => {
        const res = await fetch(`${API_BASE_URL}/task/work`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({ title, taskId })
        });
        return res.json();
    },

    toggleSubtask: async (workId) => {
        const res = await fetch(`${API_BASE_URL}/task/work/${workId}`, {
            method: 'PUT', headers: getHeaders()
        });
        return res.ok;
    },

    deleteSubtask: async (workId) => {
        const res = await fetch(`${API_BASE_URL}/task/work/${workId}`, {
            method: 'DELETE', headers: getHeaders()
        });
        return res.ok;
    },

    addComment: async (content, taskId) => {
        const res = await fetch(`${API_BASE_URL}/task/comment`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({ content, taskId })
        });
        return res.json();
    },

    toggleMemberSubtask: async (workId, memberId) => {
        const res = await fetch(`${API_BASE_URL}/task/work/${workId}/toggle-member`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify({ memberId })
        });
        return res.ok;
    },

    removeMember: async (taskId, memberId) => {
        const res = await fetch(`${API_BASE_URL}/task/${taskId}/remove-member`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify({ memberId })
        });
        return res.ok;
    },
    // --- FILE MANAGER API ---
    getFiles: async (taskId, folderId) => {
        let url = `${API_BASE_URL}/task/${taskId}/files`;
        if (folderId) url += `?folderId=${folderId}`;
        const res = await fetch(url, { headers: getHeaders() });
        return res.json();
    },

    createFolder: async (name, taskId, parentId) => {
        const res = await fetch(`${API_BASE_URL}/folder`, {
            method: 'POST', headers: getHeaders(),
            body: JSON.stringify({ name, taskId, parentId })
        });
        return res.json();
    },

    uploadFile: async (file, taskId, folderId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);
        if (folderId) formData.append('folderId', folderId);

        // Lưu ý: Khi dùng FormData, KHÔNG set Content-Type header thủ công (để trình duyệt tự set boundary)
        const token = localStorage.getItem('maneasily_token');
        const res = await fetch(`${API_BASE_URL}/file`, {
            method: 'POST',
            headers: { 'Authorization': token }, 
            body: formData
        });
        return res.json();
    },

    deleteItem: async (type, id) => {
        const res = await fetch(`${API_BASE_URL}/item/${type}/${id}`, {
            method: 'DELETE', headers: getHeaders()
        });
        return res.ok;
    },
    
    addComment: async (content, taskId) => {
        const res = await fetch(`${API_BASE_URL}/task/comment`, {
            method: 'POST', headers: getHeaders(), body: JSON.stringify({ content, taskId })
        });
        return res.json();
    },

    // [MỚI] Sửa bình luận
    updateComment: async (commentId, content) => {
        const res = await fetch(`${API_BASE_URL}/task/comment/${commentId}`, {
            method: 'PUT', headers: getHeaders(), body: JSON.stringify({ content })
        });
        return res.json();
    },

    // [MỚI] Xóa bình luận
    deleteComment: async (commentId) => {
        const res = await fetch(`${API_BASE_URL}/task/comment/${commentId}`, {
            method: 'DELETE', headers: getHeaders()
        });
        return res.ok;
    },
};