// Tự động lấy URL từ biến môi trường (khi deploy) hoặc dùng localhost (khi dev)
// Vite sử dụng import.meta.env
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';