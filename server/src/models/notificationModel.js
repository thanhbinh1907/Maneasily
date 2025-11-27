import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Types.ObjectId, ref: "users", required: true }, // Người nhận thông báo
    sender: { type: mongoose.Types.ObjectId, ref: "users" }, // Người tạo ra hành động (Admin/Manager)
    content: { type: String, required: true }, // Nội dung: "Bạn đã bị xóa khỏi dự án A"
    type: { type: String, enum: ['project', 'task', 'system'], default: 'system' },
    link: { type: String }, // Link để click vào (ví dụ link tới Board)
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("notifications", notificationSchema);