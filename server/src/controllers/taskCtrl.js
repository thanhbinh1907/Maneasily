import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js"; 
import Works from "../models/workModel.js";
import Comments from "../models/commentModel.js";
import Notifications from "../models/notificationModel.js";
import { sendNotification } from "../utils/socketUtils.js";
import { logActivity } from "../utils/activityUtils.js";

// Hàm phụ check quyền
const checkPermission = async (projectId, userId) => {
    const project = await Projects.findById(projectId);
    if (!project) return false;
    return (project.userOwner.toString() === userId) || (project.admins.includes(userId));
};

const taskCtrl = {
    getTaskDetail: async (req, res) => {
        try {
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
            console.error("❌ Lỗi getTaskDetail:", err); 
            return res.status(500).json({ err: err.message }); 
        }
    },

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

            if (updateData.members) {
                const oldMembers = oldTask.members.map(m => m.toString());
                const newMembers = updateData.members.map(m => m.toString());
                const addedMembers = newMembers.filter(m => !oldMembers.includes(m));

                for (const memberId of addedMembers) {
                    if (memberId !== userId) {
                        const notif = await Notifications.create({
                            recipient: memberId,
                            sender: userId,
                            content: `Bạn được giao việc: "${oldTask.title}"`,
                            type: 'task',
                            link: `/src/pages/Board.html?id=${oldTask.project}`
                        });
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

            req.io.to(updatedTask.project.toString()).emit('boardUpdated', {
                msg: 'Task updated',
                updaterId: req.user.id
            });        
            if (updateData.isDone !== undefined) {
                const action = updateData.isDone ? "completed task" : "uncompleted task";
                await logActivity(req, oldTask.project, action, oldTask.title);
            } else {
                await logActivity(req, oldTask.project, "updated task", oldTask.title, "đã cập nhật thông tin");
            }
            res.json({ msg: "Cập nhật thành công", task: updatedTask });
        } catch (err) { 
            console.error(err);
            return res.status(500).json({ err: err.message }); 
        }
    },

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
                const notif = await Notifications.create({
                    recipient: memberId,
                    sender: userId,
                    content: `Bạn đã bị gỡ khỏi công việc: "${task.title}"`,
                    type: 'task',
                    link: `/src/pages/Board.html?id=${task.project}`
                });

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

    createTask: async (req, res) => {
        try {
            const { title, dec, tag, color, startTime, deadline, columnId, projectId } = req.body;
            const userId = req.user.id;
            
            const canEdit = await checkPermission(projectId, userId);
            if (!canEdit) return res.status(403).json({ err: "Thành viên chỉ có quyền xem." });
            const newTask = new Tasks({
                title, 
                dec: dec || "", 
                color: color || "#00c2e0", 
                tag: tag || "",
                startTime, 
                deadline,  
                column: columnId, 
                project: projectId, 
                members: [],
            });
            await newTask.save();
            await Columns.findByIdAndUpdate(columnId, { $push: { tasks: newTask._id, taskOrder: newTask._id } });
            
            await newTask.populate("members", "username avatar");

            req.io.to(projectId).emit('boardUpdated', {
                msg: 'Task created',
                updaterId: userId
            });

            await logActivity(req, projectId, "created task", title, "đã tạo công việc mới");
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
            await logActivity(req, task.project, "deleted task", task.title, "đã xóa công việc");
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
            await logActivity(req, task.project, "added subtask", title, `đã thêm việc con vào "${task.title}"`);
            res.json({ work: newWork });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- [FIX LỖI 500 TẠI ĐÂY] ---
    toggleWork: async (req, res) => {
        try {
            const { workId } = req.params;
            const work = await Works.findById(workId);
            if (!work) return res.status(404).json({ err: "Không tìm thấy công việc con" });

            work.isDone = !work.isDone;
            await work.save();

            // [FIX] Phải tìm task cha để lấy projectId gửi socket
            const task = await Tasks.findById(work.task);
            
            if (task) {
                req.io.to(task.project.toString()).emit('boardUpdated', {
                    msg: 'Subtask toggled', 
                    updaterId: req.user.id
                });
                
                const action = work.isDone ? "completed subtask" : "uncompleted subtask";
                await logActivity(req, task.project, action, work.title, `trong công việc "${task.title}"`);
            }

            res.json({ msg: "Đã cập nhật trạng thái", work });
        } catch (err) { 
            console.error(err);
            return res.status(500).json({ err: err.message }); 
        }
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

            await logActivity(req, task.project, "commented", task.title, content, "comment");
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

    getScheduleData: async (req, res) => {
        try {
            const userId = req.user.id;
            const tasks = await Tasks.find({ members: userId })
                .populate("project", "title") 
                .populate("column", "title") 
                .select("title deadline startTime createdAt project column");

            const validTasks = tasks.filter(t => t.project && t.column);

            res.json({ tasks: validTasks });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- [MỚI] SỬA BÌNH LUẬN ---
    updateComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const userId = req.user.id;

            const comment = await Comments.findById(commentId);
            if (!comment) return res.status(404).json({ err: "Bình luận không tồn tại." });

            // Chỉ chủ sở hữu mới được sửa
            if (comment.user.toString() !== userId) {
                return res.status(403).json({ err: "Bạn không có quyền sửa bình luận này." });
            }

            comment.content = content;
            await comment.save();
            
            // Populate lại user để trả về frontend cập nhật ngay
            await comment.populate("user", "username avatar");

            res.json({ msg: "Đã cập nhật bình luận", comment });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- [MỚI] XÓA BÌNH LUẬN ---
    deleteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.id;

            const comment = await Comments.findById(commentId);
            if (!comment) return res.status(404).json({ err: "Bình luận không tồn tại." });

            // Check quyền: Chủ comment HOẶC Admin dự án (để admin xóa spam)
            // Ở đây làm đơn giản: Chỉ chủ comment mới xóa được
            if (comment.user.toString() !== userId) {
                 // (Mở rộng: Bạn có thể check thêm quyền Admin dự án ở đây nếu muốn)
                return res.status(403).json({ err: "Bạn không có quyền xóa bình luận này." });
            }

            // 1. Xóa khỏi collection Comments
            await Comments.findByIdAndDelete(commentId);

            // 2. Xóa reference trong Task
            await Tasks.findByIdAndUpdate(comment.task, {
                $pull: { comments: commentId }
            });

            res.json({ msg: "Đã xóa bình luận" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    }
};

export default taskCtrl;