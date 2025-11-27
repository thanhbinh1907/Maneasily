
export const sendNotification = (req, recipientId, notificationData) => {
    // [BẢO VỆ] Kiểm tra xem biến socket có tồn tại không
    if (!req.onlineUsers || !req.io) {
        console.error("⚠️ Lỗi: Server chưa cấu hình Socket.io vào request!");
        return; 
    }

    // Tìm socketId của người nhận và gửi thông báo
    const user = req.onlineUsers.find(u => u.userId === recipientId.toString());
    if (user) {
        req.io.to(user.socketId).emit('newNotification', notificationData);
        console.log(`✅ Socket: Đã gửi thông báo tới user ${recipientId}`);
    }
};