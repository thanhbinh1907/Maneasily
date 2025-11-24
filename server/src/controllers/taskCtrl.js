import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js"; 
// Hàm phụ để kiểm tra quyền (tránh viết lặp lại)
const checkPermission = async (projectId, userId) => {
    const project = await Projects.findById(projectId);
    if (!project) return false;
    
    // Cho phép nếu là Chủ dự án hoặc nằm trong danh sách Quản lý
    const isOwner = project.userOwner.toString() === userId;
    const isManager = project.admins.includes(userId);
    
    return isOwner || isManager;
};

const taskCtrl = {
    // --- 1. TẠO TASK (Có check quyền) ---
    createTask: async (req, res) => {
        try {
            const { title, dec, tag, color, columnId, projectId } = req.body;
            const userId = req.user.id; // Lấy từ token

            // --> BƯỚC BẢO VỆ <--
            const canEdit = await checkPermission(projectId, userId);
            if (!canEdit) {
                return res.status(403).json({ err: "Thành viên chỉ có quyền xem." });
            }

            const newTask = new Tasks({
                title, 
                dec: dec || "",
                color: color || "#00c2e0",
                tag: tag || "",
                column: columnId,
                project: projectId,
                members: [], // Mặc định rỗng, sau này gán người làm sau
            });
            await newTask.save();

            // Cập nhật cột
            await Columns.findByIdAndUpdate(columnId, {
                $push: { tasks: newTask._id, taskOrder: newTask._id }
            });

            await newTask.populate("members", "username avatar");
            res.json({ task: newTask });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- 2. XÓA TASK (Có check quyền) ---
    deleteTask: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Tìm task để lấy projectId
            const task = await Tasks.findById(id);
            if (!task) return res.status(404).json({ err: "Task không tồn tại" });

            // --> BƯỚC BẢO VỆ <--
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) {
                return res.status(403).json({ err: "Bạn không có quyền xóa task này." });
            }

            await Tasks.findByIdAndDelete(id);

            // Xóa task khỏi cột
            await Columns.findByIdAndUpdate(task.column, {
                $pull: { tasks: id, taskOrder: id }
            });

            res.json({ msg: "Đã xóa nhiệm vụ thành công!" });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default taskCtrl;