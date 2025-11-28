import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    project: { type: mongoose.Types.ObjectId, ref: "projects", required: true },
    user: { type: mongoose.Types.ObjectId, ref: "users", required: true }, // Người thực hiện
    action: { type: String, required: true }, // VD: "created task", "commented", "joined"
    target: { type: String }, // Tên của đối tượng bị tác động (Tên task, tên cột...)
    details: { type: String }, // Chi tiết thêm (nội dung comment, link...)
    type: { type: String, enum: ['task', 'member', 'project', 'comment', 'column'], default: 'task' }
}, { timestamps: true });

export default mongoose.model("activities", activitySchema);