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
    }
};