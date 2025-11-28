import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Types.ObjectId, ref: "users", required: true },
    sender: { type: mongoose.Types.ObjectId, ref: "users" },
    content: { type: String, required: true },
    
    // 👇👇👇 THÊM 'invite' VÀO MẢNG NÀY 👇👇👇
    type: { 
        type: String, 
        enum: ['project', 'task', 'system', 'invite'], // <--- Thêm 'invite' ở đây
        default: 'system' 
    },
    
    link: { type: String },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("notifications", notificationSchema);