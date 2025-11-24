import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js"; 
import Works from "../models/workModel.js";
import Comments from "../models/commentModel.js";
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
    },
    getTaskDetail: async (req, res) => {
        try {
            const task = await Tasks.findById(req.params.id)
                .populate("works") // Lấy danh sách công việc con
                .populate({
                    path: "comments",
                    populate: { path: "user", select: "username avatar" } // Lấy người comment
                })
                .populate("members", "username avatar email");

            if (!task) return res.status(404).json({ err: "Không tìm thấy task" });
            res.json({ task });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 2. CẬP NHẬT TASK (Title, Desc, Deadline, Tag, Color...) ---
    updateTask: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const updateData = req.body; // { title, dec, tag, deadline, color... }

            const task = await Tasks.findById(id);
            
            // Check quyền: Chỉ Admin/Manager mới được sửa
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn chỉ có quyền xem." });

            const updatedTask = await Tasks.findByIdAndUpdate(id, updateData, { new: true });
            res.json({ msg: "Cập nhật thành công", task: updatedTask });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 3. THÊM CÔNG VIỆC CON (Subtask) ---
    addWork: async (req, res) => {
        try {
            const { title, taskId } = req.body;
            const task = await Tasks.findById(taskId);
            
            // Check quyền
            const canEdit = await checkPermission(task.project, req.user.id);
            if (!canEdit) return res.status(403).json({ err: "Không có quyền thêm việc." });

            const newWork = new Works({ title, task: taskId });
            await newWork.save();

            await Tasks.findByIdAndUpdate(taskId, { $push: { works: newWork._id } });
            res.json({ work: newWork });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 4. CẬP NHẬT TRẠNG THÁI SUBTASK (Xong/Chưa xong) ---
    toggleWork: async (req, res) => {
        try {
            const { workId } = req.params;
            const work = await Works.findById(workId);
            // Logic check quyền ở đây nếu cần chặt chẽ (tạm bỏ qua để code gọn)
            
            work.isDone = !work.isDone;
            await work.save();
            res.json({ msg: "Đã cập nhật trạng thái", work });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 5. BÌNH LUẬN (Ai cũng được comment) ---
    addComment: async (req, res) => {
        try {
            const { content, taskId } = req.body;
            const userId = req.user.id;

            const newComment = new Comments({ content, user: userId, task: taskId });
            await newComment.save();

            await Tasks.findByIdAndUpdate(taskId, { $push: { comments: newComment._id } });
            
            // Populate để trả về frontend hiển thị ngay
            await newComment.populate("user", "username avatar");
            
            res.json({ comment: newComment });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    }
};

export default taskCtrl;