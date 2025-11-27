// File: Maneasily/server/src/controllers/notificationCtrl.js
import Notifications from "../models/notificationModel.js";

const notificationCtrl = {
    // --- LẤY THÔNG BÁO (CÓ PHÂN TRANG) ---
    getNotifications: async (req, res) => {
        try {
            // Lấy tham số page từ URL, mặc định là 1
            const page = parseInt(req.query.page) || 1;
            const limit = 5; // Giới hạn 5 tin mỗi lần tải
            const skip = (page - 1) * limit;

            const notifs = await Notifications.find({ recipient: req.user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("sender", "username avatar");
            
            // Đếm tổng số chưa đọc (không phụ thuộc trang)
            const unreadCount = await Notifications.countDocuments({ recipient: req.user.id, isRead: false });
            
            // Kiểm tra xem còn trang sau không
            const total = await Notifications.countDocuments({ recipient: req.user.id });
            const hasMore = total > skip + limit;

            res.json({ notifications: notifs, unreadCount, hasMore });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- XÓA THÔNG BÁO ---
    deleteNotification: async (req, res) => {
        try {
            const notif = await Notifications.findById(req.params.id);
            if (!notif) return res.status(404).json({ err: "Thông báo không tồn tại" });
            
            // Chỉ người nhận mới được xóa
            if (notif.recipient.toString() !== req.user.id) {
                return res.status(403).json({ err: "Không có quyền xóa." });
            }

            await Notifications.findByIdAndDelete(req.params.id);
            res.json({ msg: "Đã xóa thông báo" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    markRead: async (req, res) => { 
        try {
            await Notifications.findByIdAndUpdate(req.params.id, { isRead: true });
            res.json({ msg: "Đã đọc" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    
    markAllRead: async (req, res) => { 
        try {
            await Notifications.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
            res.json({ msg: "Đã đọc tất cả" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    }
};

export default notificationCtrl;