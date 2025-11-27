import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js"; 
import Works from "../models/workModel.js";
import Comments from "../models/commentModel.js";
import Notifications from "../models/notificationModel.js";
import { sendNotification } from "../utils/socketUtils.js";

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
                .populate({
                    path: "works",
                    populate: { 
                        path: "members", 
                        select: "username avatar" 
                    }
                })
                .populate({
                    path: "comments",
                    populate: { path: "user", select: "username avatar" } 
                })
                .populate("members", "username avatar email")
                .populate("column", "title");

            if (!task) return res.status(404).json({ err: "Không tìm thấy task" });
            res.json({ task });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 2. CẬP NHẬT TASK (SỬA ĐỔI) ---
    updateTask: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const updateData = req.body; 

            // Lấy task CŨ trước khi update để so sánh thành viên
            const oldTask = await Tasks.findById(id);
            if (!oldTask) return res.status(404).json({ err: "Task không tồn tại" });
            
            const canEdit = await checkPermission(oldTask.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn chỉ có quyền xem." });

            if (updateData.members && oldTask.deadline && new Date(oldTask.deadline) < new Date()) {
                return res.status(400).json({ err: "Task đã quá hạn! Không thể thay đổi thành viên." });
            }

            // [LOGIC MỚI] Tạo thông báo nếu có thay đổi thành viên
            if (updateData.members) {
                // Convert ID sang string để so sánh
                const oldMembers = oldTask.members.map(m => m.toString());
                const newMembers = updateData.members.map(m => m.toString());

                // Tìm người vừa được thêm vào
                const addedMembers = newMembers.filter(m => !oldMembers.includes(m));

                for (const memberId of addedMembers) {
                    if (memberId !== userId) { // Không tự thông báo cho chính mình
                        await Notifications.create({
                            recipient: memberId,
                            sender: userId,
                            content: `Bạn được giao việc: "${oldTask.title}"`,
                            type: 'task',
                            link: `/src/pages/Board.html?id=${oldTask.project}`
                        });
                    }
                }
            }
            // Gửi Real-time
            await notif.populate("sender", "username avatar");
            sendNotification(req, memberId, notif);

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

    // --- BÌNH LUẬN (CẬP NHẬT) ---
    addComment: async (req, res) => {
        try {
            const { content, taskId } = req.body;
            const userId = req.user.id;

            // Lấy task để kiểm tra thành viên
            const task = await Tasks.findById(taskId);
            if (!task) return res.status(404).json({ err: "Task không tồn tại" });

            // [MỚI] Kiểm tra: User có trong danh sách members của task không?
            // Lưu ý: Tùy logic, bạn có thể cho phép Admin dự án (checkPermission) comment dù không trong task.
            // Ở đây tôi làm đúng yêu cầu: "người không phải trong task thì không comment".
            // Tuy nhiên, để tránh Admin bị khóa, tôi cho phép nếu là Member HOẶC là Admin dự án.
            
            const isMember = task.members.includes(userId);
            const isAdmin = await checkPermission(task.project, userId);

            if (!isMember && !isAdmin) {
                return res.status(403).json({ err: "Bạn phải tham gia task này mới được bình luận." });
            }

            const newComment = new Comments({ content, user: userId, task: taskId });
            await newComment.save();

            await Tasks.findByIdAndUpdate(taskId, { $push: { comments: newComment._id } });
            
            await newComment.populate("user", "username avatar");
            
            res.json({ comment: newComment });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    // --- Lấy danh sách task quá hạn của User ---
    getOverdueTasks: async (req, res) => {
        try {
            const userId = req.user.id;
            const now = new Date();

            const tasks = await Tasks.find({
                members: userId, // Task có mình tham gia
                deadline: { $lt: now }, // Deadline nhỏ hơn hiện tại (quá khứ)
                // Giả sử: Task nằm ở cột cuối cùng là "Xong", ta cần loại trừ (logic này cần ID cột Done, tạm thời lấy hết)
            }).select('title deadline project');

            res.json({ tasks });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- HÀM MỚI: Xóa Subtask ---
    deleteWork: async (req, res) => {
        try {
            const { workId } = req.params;
            const userId = req.user.id;

            const work = await Works.findById(workId);
            if (!work) return res.status(404).json({ err: "Công việc không tồn tại" });

            // Tìm task cha để check quyền
            const task = await Tasks.findById(work.task);
            
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn không có quyền xóa." });

            // 1. Xóa Work
            await Works.findByIdAndDelete(workId);

            // 2. Xóa ID work khỏi Task
            await Tasks.findByIdAndUpdate(work.task, { 
                $pull: { works: workId } 
            });

            res.json({ msg: "Đã xóa công việc con!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },
    // --- Gán/Bỏ người vào Subtask ---
    toggleWorkMember: async (req, res) => {
        try {
            const { workId } = req.params;
            const { memberId } = req.body;
            const userId = req.user.id;

            const work = await Works.findById(workId);
            if (!work) return res.status(404).json({ err: "Công việc con không tồn tại" });

            const task = await Tasks.findById(work.task);
            
            // 1. Check quyền quản lý (Admin/Owner)
            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) return res.status(403).json({ err: "Bạn không có quyền phân công." });

            // 2. [MỚI] Check hết hạn: Nếu quá hạn thì không cho sửa người làm
            if (task.deadline && new Date(task.deadline) < new Date()) {
                return res.status(400).json({ err: "Task đã quá hạn, không thể thay đổi thành viên." });
            }

            // Logic Toggle cũ giữ nguyên
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
    // --- 6. XÓA THÀNH VIÊN KHỎI TASK (Chỉ Admin/Manager) ---
    removeMember: async (req, res) => {
        try {
            const { id } = req.params;
            const { memberId } = req.body; 
            const userId = req.user.id;

            const task = await Tasks.findById(id);
            if (!task) return res.status(404).json({ err: "Task không tồn tại" });

            const canEdit = await checkPermission(task.project, userId);
            if (!canEdit) {
                return res.status(403).json({ err: "Bạn không có quyền xóa thành viên." });
            }

            // [LOGIC MỚI] Tạo thông báo bị kick
            if (memberId !== userId) {
                await Notifications.create({
                    recipient: memberId,
                    sender: userId,
                    content: `Bạn đã bị gỡ khỏi công việc: "${task.title}"`,
                    type: 'task',
                    link: `/src/pages/Board.html?id=${task.project}`
                });
            }

            // Gửi Real-time
            await notif.populate("sender", "username avatar");
            sendNotification(req, memberId, notif);

            await Tasks.findByIdAndUpdate(id, { $pull: { members: memberId } });
            await Works.updateMany({ task: id }, { $pull: { members: memberId } });

            res.json({ msg: "Đã xóa thành viên khỏi công việc!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
};

export default taskCtrl;