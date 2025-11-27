// File: Maneasily/server/src/controllers/projectCtrl.js

import Projects from "../models/projectModel.js";
import Users from "../models/userModel.js"; 
import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";
import { v4 as uuidv4 } from 'uuid';
import Notifications from "../models/notificationModel.js";

const projectCtrl = {
    // --- 1. Lấy thông tin chi tiết 1 Project (Giữ nguyên hàm cũ của bạn) ---
    getProject: async (req, res) => {
        try {
            const { id } = req.params;
            const project = await Projects.findById(id)
                .populate("members", "username email avatar")
                .populate({
                    path: "columns",
                    populate: {
                        path: "tasks",
                        model: "tasks",
                        populate: {
                            path: "members",
                            model: "users",
                            select: "username avatar"
                        }
                    },
                });
            
            if (!project) return res.status(404).json({ err: "Không tìm thấy project" });
            res.json({ project });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- 2. Cập nhật thứ tự cột (Giữ nguyên hàm cũ) ---
    updateColumnOrder: async (req, res) => {
        try {
            const { id } = req.params;
            const { columnOrder } = req.body;
            await Projects.findByIdAndUpdate(id, { columnOrder: columnOrder });
            res.json({ msg: "Đã cập nhật thứ tự cột!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- 3. (MỚI) Tạo Project ---
    createProject: async (req, res) => {
        try {
            // 1. Nhận thêm dec và img từ frontend gửi lên
            const { title, dec, img, userId } = req.body;

            const newProject = new Projects({
                title: title,
                // Nếu user không nhập thì dùng giá trị mặc định
                dec: dec || "Mô tả dự án của bạn...", 
                img: img || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500",
                userOwner: userId,
                admins: [userId],
                members: [userId],
                columns: [],
                columnOrder: []
            });

            await newProject.save();

            await Users.findByIdAndUpdate(userId, {
                $push: { projects: newProject._id }
            });

            res.json({ msg: "Tạo dự án thành công!", project: newProject });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- 4. (MỚI) Lấy tất cả Project của 1 User ---
    getUserProjects: async (req, res) => {
        try {
            const { userId } = req.query;
            
            const user = await Users.findById(userId).populate({
                path: "projects",
                populate: {
                    path: "userOwner",
                    select: "username email avatar" // Chỉ lấy các trường cần thiết
                }
            });
            
            if (!user) return res.status(404).json({ err: "User không tồn tại" });

            res.json({ projects: user.projects });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- 5. (MỚI) Cập nhật thứ tự sắp xếp dự án của User ---
    updateProjectOrder: async (req, res) => {
        try {
            const { userId, projectOrder } = req.body; // projectOrder là mảng các project ID đã sắp xếp
            
            // Cập nhật lại mảng projects trong User
            await Users.findByIdAndUpdate(userId, {
                projects: projectOrder
            });

            res.json({ msg: "Đã cập nhật thứ tự dự án!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- 6. (MỚI) Xóa Project và toàn bộ dữ liệu liên quan ---
    deleteProject: async (req, res) => {
        try {
            const { id } = req.params; // ID của project cần xóa

            // 1. Tìm project để đảm bảo nó tồn tại
            const project = await Projects.findById(id);
            if (!project) {
                return res.status(404).json({ err: "Dự án không tồn tại" });
            }

            // 2. Xóa tất cả Tasks thuộc project này
            await Tasks.deleteMany({ project: id });

            // 3. Xóa tất cả Columns thuộc project này
            await Columns.deleteMany({ project: id });

            // 4. Xóa ID project khỏi mảng 'projects' của User (Người sở hữu)
            // Cách an toàn: Xóa ở tất cả user có chứa project này (phòng trường hợp share)
            await Users.updateMany(
                { projects: id },
                { $pull: { projects: id } }
            );

            // 5. Cuối cùng: Xóa Project
            await Projects.findByIdAndDelete(id);

            res.json({ msg: "Đã xóa dự án và toàn bộ dữ liệu liên quan!" });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    getInviteLink: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const project = await Projects.findById(id);
            if (!project) return res.status(404).json({ err: "Dự án không tồn tại" });

            // --- BƯỚC BẢO VỆ MỚI ---
            const isOwner = project.userOwner.toString() === userId;
            const isManager = project.admins.includes(userId);
            
            if (!isOwner && !isManager) {
                return res.status(403).json({ err: "Bạn không có quyền lấy link mời." });
            }
            // -----------------------

            if (!project.inviteId) {
                project.inviteId = uuidv4();
                await project.save();
            }

            const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/src/pages/invite.html?code=${project.inviteId}`;
            res.json({ inviteUrl });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- 2. Xử lý tham gia dự án qua Link ---
    joinProjectByLink: async (req, res) => {
        try {
            const { code } = req.body;
            const userId = req.user.id; // Lấy từ middleware auth

            // Tìm dự án có mã inviteId tương ứng
            const project = await Projects.findOne({ inviteId: code });
            if (!project) return res.status(404).json({ err: "Liên kết không hợp lệ hoặc đã hết hạn." });

            // Kiểm tra xem user đã là thành viên chưa
            if (project.members.includes(userId)) {
                return res.json({ msg: "Bạn đã là thành viên dự án này!", projectId: project._id });
            }

            // Thêm user vào project
            await Projects.findByIdAndUpdate(project._id, {
                $addToSet: { members: userId }
            });

            // Thêm project vào user
            await Users.findByIdAndUpdate(userId, {
                $addToSet: { projects: project._id }
            });

            res.json({ msg: "Tham gia thành công!", projectId: project._id });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    /// ------------------ Quản lý thành viên dự án ------------------ ///

    // --- 1. Thăng chức thành Manager ---
    promoteToManager: async (req, res) => {
        try {
            const { projectId, memberId } = req.body;
            const userId = req.user.id; // ID người đang gọi API (Chủ dự án)

            const project = await Projects.findById(projectId);
            if (project.userOwner.toString() !== userId) {
                return res.status(403).json({ err: "Chỉ chủ dự án mới được cấp quyền quản lý." });
            }

            await Projects.findByIdAndUpdate(projectId, {
                $addToSet: { admins: memberId } // Thêm vào danh sách quản lý
            });

            res.json({ msg: "Đã cấp quyền quản lý!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 2. Tước quyền Manager (Về thành viên thường) ---
    demoteToMember: async (req, res) => {
        try {
            const { projectId, memberId } = req.body;
            const userId = req.user.id;

            const project = await Projects.findById(projectId);
            if (project.userOwner.toString() !== userId) {
                return res.status(403).json({ err: "Chỉ chủ dự án mới được thu hồi quyền." });
            }

            await Projects.findByIdAndUpdate(projectId, {
                $pull: { admins: memberId } // Xóa khỏi danh sách quản lý
            });

            await Notifications.create({
                recipient: memberId,
                sender: userId,
                content: `Bạn đã bị mời ra khỏi dự án "${project.title}"`,
                type: 'project',
                link: '#' // Kick rồi thì không còn link vào board nữa
            });
            await notif.populate("sender", "username avatar");
            sendNotification(req, recipientId, notifObject);

            res.json({ msg: "Đã thu hồi quyền quản lý!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 3. Kick thành viên khỏi dự án ---
    removeMember: async (req, res) => {
        try {
            const { projectId, memberId } = req.body;
            const userId = req.user.id; 

            const project = await Projects.findById(projectId);
            
            // ... (Logic kiểm tra quyền cũ giữ nguyên) ...
            const isOwner = project.userOwner.toString() === userId;
            const isManager = project.admins.includes(userId);
            const targetIsOwner = project.userOwner.toString() === memberId;
            const targetIsManager = project.admins.includes(memberId);

            if (targetIsOwner) return res.status(403).json({ err: "Không thể kick chủ dự án." });
            if (isManager && targetIsManager) return res.status(403).json({ err: "Quản lý không thể kick quản lý khác." });
            if (!isOwner && !isManager) return res.status(403).json({ err: "Bạn không có quyền kick thành viên." });

            // [LOGIC MỚI] Tạo thông báo bị kick khỏi dự án
            if (memberId !== userId) {
                await Notifications.create({
                    recipient: memberId, // Người bị kick
                    sender: userId,      // Người thực hiện
                    content: `Bạn đã bị mời ra khỏi dự án "${project.title}"`,
                    type: 'project',
                    link: '#' // Không còn link vào dự án nữa
                });
            }
            await notif.populate("sender", "username avatar");
            sendNotification(req, recipientId, notifObject);

            await Projects.findByIdAndUpdate(projectId, {
                $pull: { members: memberId, admins: memberId }
            });
            
            await Users.findByIdAndUpdate(memberId, {
                $pull: { projects: projectId }
            });

            res.json({ msg: "Đã mời thành viên ra khỏi dự án." });

        } catch (err) { return res.status(500).json({ err: err.message }); }
    }
};

export default projectCtrl;