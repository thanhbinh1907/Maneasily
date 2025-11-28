import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js"; 
import Works from "../models/workModel.js";
import Comments from "../models/commentModel.js";
import Notifications from "../models/notificationModel.js";
import { sendNotification } from "../utils/socketUtils.js";

// Hàm phụ check quyền
const checkPermission = async (projectId, userId) => {
    const project = await Projects.findById(projectId);
    if (!project) return false;
    return (project.userOwner.toString() === userId) || (project.admins.includes(userId));
};

const taskCtrl = {
    // --- 1. LẤY CHI TIẾT TASK (DEBUG LỖI 500) ---
    getTaskDetail: async (req, res) => {
        try {
            // console.log("👉 Lấy task:", req.params.id); 
            const task = await Tasks.findById(req.params.id)
                .populate({
                    path: "works",
                    populate: { path: "members", select: "username avatar" }
                })
                .populate({
                    path: "comments",
                    populate: { path: "user", select: "username avatar" }
                })
                .populate("members", "username avatar email")
                .populate("column", "title");

            if (!task) return res.status(404).json({ err: "Không tìm thấy task" });
            res.json({ task });
        } catch (err) { 
            console.error("❌ Lỗi getTaskDetail:", err); // In lỗi ra terminal để dễ sửa
            return res.status(500).json({ err: err.message }); 
        }
    },

    // --- 2. CẬP NHẬT TASK (ĐÃ SỬA LỖI CRASH) ---
    updateTask: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const updateData = req.body; 

            const oldTask = await Tasks.findById(id);
            if (!oldTask) return res.status(404).json({ err: "Task không tồn tại" });
            
            const canEdit = await checkPermission(oldTask.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn chỉ có quyền xem." });

            if (updateData.members && oldTask.deadline && new Date(oldTask.deadline) < new Date()) {
                return res.status(400).json({ err: "Task đã quá hạn! Không thể thay đổi thành viên." });
            }

            // [LOGIC MỚI] Gửi thông báo
            if (updateData.members) {
                const oldMembers = oldTask.members.map(m => m.toString());
                const newMembers = updateData.members.map(m => m.toString());
                const addedMembers = newMembers.filter(m => !oldMembers.includes(m));

                for (const memberId of addedMembers) {
                    if (memberId !== userId) {
                        // 1. Tạo thông báo
                        const notif = await Notifications.create({
                            recipient: memberId,
                            sender: userId,
                            content: `Bạn được giao việc: "${oldTask.title}"`,
                            type: 'task',
                            link: `/src/pages/Board.html?id=${oldTask.project}`
                        });
                        
                        // 2. Populate và gửi Socket NGAY TRONG VÒNG LẶP
                        await notif.populate("sender", "username avatar");
                        sendNotification(req, memberId, notif);
                    }
                }
            }

            const updatedTask = await Tasks.findByIdAndUpdate(id, updateData, { new: true })
                .populate({
                    path: "works",
                    populate: { path: "members", select: "username avatar" }
                })
                .populate({
                    path: "comments",
                    populate: { path: "user", select: "username avatar" }
                })
                .populate("members", "username avatar email")
                .populate("column", "title");

            // 👇 [THÊM] Gửi Socket Realtime
            req.io.to(updatedTask.project.toString()).emit('boardUpdated', {
                msg: 'Task updated',
                updaterId: req.user.id
            });        

            res.json({ msg: "Cập nhật thành công", task: updatedTask });
        } catch (err) { 
            console.error(err);
            return res.status(500).json({ err: err.message }); 
        }
    },

    // --- 3. XÓA THÀNH VIÊN (ĐÃ SỬA LỖI CRASH) ---
    removeMember: async (req, res) => {
        try {
            const { id } = req.params;
            const { memberId } = req.body; 
            const userId = req.user.id;

            const task = await Tasks.findById(id);
            if (!task) return res.status(404).json({ err: "Task không tồn tại" });

            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn không có quyền xóa thành viên." });

            if (memberId !== userId) {
                // 1. Gán kết quả vào biến `notif`
                const notif = await Notifications.create({
                    recipient: memberId,
                    sender: userId,
                    content: `Bạn đã bị gỡ khỏi công việc: "${task.title}"`,
                    type: 'task',
                    link: `/src/pages/Board.html?id=${task.project}`
                });

                // 2. Gửi Socket
                await notif.populate("sender", "username avatar");
                sendNotification(req, memberId, notif);
            }

            await Tasks.findByIdAndUpdate(id, { $pull: { members: memberId } });
            await Works.updateMany({ task: id }, { $pull: { members: memberId } });

            res.json({ msg: "Đã xóa thành viên khỏi công việc!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- CÁC HÀM KHÁC GIỮ NGUYÊN (Copy lại để đủ file) ---
    createTask: async (req, res) => {
        try {
            const { title, dec, tag, color, columnId, projectId } = req.body;
            const userId = req.user.id;
            
            const canEdit = await checkPermission(projectId, userId);
            if (!canEdit) return res.status(403).json({ err: "Thành viên chỉ có quyền xem." });

            const newTask = new Tasks({
                title, dec: dec || "", color: color || "#00c2e0", tag: tag || "",
                column: columnId, project: projectId, members: [],
            });
            await newTask.save();
            await Columns.findByIdAndUpdate(columnId, { $push: { tasks: newTask._id, taskOrder: newTask._id } });
            
            await newTask.populate("members", "username avatar");

            // [MỚI] Gửi Socket báo có Task mới
            req.io.to(projectId).emit('boardUpdated', {
                msg: 'Task created',
                updaterId: userId
            });

            res.json({ task: newTask });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    deleteTask: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const task = await Tasks.findById(id);
            if (!task) return res.status(404).json({ err: "Task không tồn tại" });
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn không có quyền xóa task này." });
            await Tasks.findByIdAndDelete(id);
            await Columns.findByIdAndUpdate(task.column, { $pull: { tasks: id, taskOrder: id } });

            req.io.to(task.project.toString()).emit('boardUpdated', {
                msg: 'Task deleted',
                updaterId: req.user.id
            });

            res.json({ msg: "Đã xóa nhiệm vụ thành công!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    addWork: async (req, res) => {
        try {
            const { title, taskId } = req.body;
            const task = await Tasks.findById(taskId);
            const canEdit = await checkPermission(task.project, req.user.id);
            if (!canEdit) return res.status(403).json({ err: "Không có quyền thêm việc." });
            const newWork = new Works({ title, task: taskId });
            await newWork.save();
            await Tasks.findByIdAndUpdate(taskId, { $push: { works: newWork._id } });

            req.io.to(task.project.toString()).emit('boardUpdated', {
                msg: 'Subtask added', updaterId: req.user.id
            });
            res.json({ work: newWork });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    toggleWork: async (req, res) => {
        try {
            const { workId } = req.params;
            const work = await Works.findById(workId);
            work.isDone = !work.isDone;
            await work.save();

            if (task) {
                req.io.to(task.project.toString()).emit('boardUpdated', {
                    msg: 'Subtask toggled', updaterId: req.user.id
                });
            }
            res.json({ msg: "Đã cập nhật trạng thái", work });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    addComment: async (req, res) => {
        try {
            const { content, taskId } = req.body;
            const userId = req.user.id;
            const task = await Tasks.findById(taskId);
            if (!task) return res.status(404).json({ err: "Task không tồn tại" });
            const isMember = task.members.includes(userId);
            const isAdmin = await checkPermission(task.project, userId);
            if (!isMember && !isAdmin) return res.status(403).json({ err: "Bạn phải tham gia task này mới được bình luận." });
            const newComment = new Comments({ content, user: userId, task: taskId });
            await newComment.save();
            await Tasks.findByIdAndUpdate(taskId, { $push: { comments: newComment._id } });
            await newComment.populate("user", "username avatar");
            res.json({ comment: newComment });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    getOverdueTasks: async (req, res) => {
        try {
            const userId = req.user.id;
            const now = new Date();
            const tasks = await Tasks.find({ members: userId, deadline: { $lt: now } }).select('title deadline project');
            res.json({ tasks });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    deleteWork: async (req, res) => {
        try {
            const { workId } = req.params;
            const userId = req.user.id;
            const work = await Works.findById(workId);
            if (!work) return res.status(404).json({ err: "Công việc không tồn tại" });
            const task = await Tasks.findById(work.task);
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn không có quyền xóa." });
            await Works.findByIdAndDelete(workId);
            await Tasks.findByIdAndUpdate(work.task, { $pull: { works: workId } });

            req.io.to(task.project.toString()).emit('boardUpdated', {
                msg: 'Subtask deleted', updaterId: req.user.id
            });
            res.json({ msg: "Đã xóa công việc con!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    toggleWorkMember: async (req, res) => {
        try {
            const { workId } = req.params;
            const { memberId } = req.body;
            const userId = req.user.id;
            const work = await Works.findById(workId);
            if (!work) return res.status(404).json({ err: "Công việc con không tồn tại" });
            const task = await Tasks.findById(work.task);
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn không có quyền phân công." });
            if (task.deadline && new Date(task.deadline) < new Date()) {
                return res.status(400).json({ err: "Task đã quá hạn, không thể thay đổi thành viên." });
            }
            let action = "added";
            if (work.members.includes(memberId)) {
                await Works.findByIdAndUpdate(workId, { $pull: { members: memberId } });
                action = "removed";
            } else {
                await Works.findByIdAndUpdate(workId, { $addToSet: { members: memberId } });
            }
            res.json({ msg: "Cập nhật thành công", action });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
};

export default taskCtrl;