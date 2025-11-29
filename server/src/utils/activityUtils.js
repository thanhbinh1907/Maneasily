import Activities from "../models/activityModel.js";

export const logActivity = async (req, projectId, action, target, details = "", type = "task") => {
    try {
        if (!req.user || !req.user.id) return;
        
        await Activities.create({
            project: projectId,
            user: req.user.id,
            action,
            target,
            details,
            type
        });
        
        // (Tùy chọn) Gửi socket realtime báo có activity mới
        if (req.io) {
            req.io.to(projectId.toString()).emit('newActivity', { projectId });
        }
    } catch (err) {
        console.error("❌ Lỗi ghi log hoạt động:", err);
    }
};