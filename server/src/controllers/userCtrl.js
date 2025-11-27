import Users from "../models/userModel.js";
import Projects from "../models/projectModel.js";
import Notifications from "../models/notificationModel.js";

const userCtrl = {
    // API Tìm kiếm người dùng (Tối ưu: Index + Prefix Regex + Lean + Projection)
    searchUsers: async (req, res) => {
        try {
            const { q } = req.query; 
            if (!q) return res.json({ users: [] });

            // Regex: `^${q}` nghĩa là "Bắt đầu bằng từ khóa q"
            // Ví dụ: q="dev" -> Tìm "developer", KHÔNG tìm "webdev"
            // $options: 'i' -> Không phân biệt hoa thường
            const users = await Users.find({
                $or: [
                    { username: { $regex: `^${q}`, $options: 'i' } },
                    { email: { $regex: `^${q}`, $options: 'i' } }
                ]
            })
            .lean() // QUAN TRỌNG: Bỏ qua bước tạo Mongoose Document, trả về JSON thuần (nhanh gấp 2-3 lần)
            .limit(5) // Chỉ lấy 5 kết quả đầu tiên
            .select("username email avatar"); // Chỉ lấy 3 trường cần thiết

            res.json({ users });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // API Thêm thành viên (Giữ nguyên logic cũ)
    addMemberToProject: async (req, res) => {
        try {
            const { projectId, userId: memberIdToAdd } = req.body; // userId là người được thêm
            const requesterId = req.user.id; // Người đang thực hiện hành động

            const project = await Projects.findById(projectId);
            if (!project) return res.status(404).json({ err: "Dự án không tồn tại" });

            // --- CHECK QUYỀN ---
            const isOwner = project.userOwner.toString() === requesterId;
            const isManager = project.admins.includes(requesterId);

            if (!isOwner && !isManager) {
                return res.status(403).json({ err: "Bạn không có quyền thêm thành viên." });
            }
            // -------------------

            // 1. Cập nhật Project
            await Projects.findByIdAndUpdate(projectId, {
                $addToSet: { members: memberIdToAdd } 
            });

            // 2. Cập nhật User
            await Users.findByIdAndUpdate(memberIdToAdd, {
                $addToSet: { projects: projectId }
            });

            // 3. Thông báo cho User
            await Notifications.create({
                recipient: memberIdToAdd,
                sender: requesterId,
                content: `Bạn đã được thêm vào dự án "${project.title}"`,
                type: 'project',
                link: `/src/pages/Board.html?id=${projectId}`
            });
            res.json({ msg: "Đã thêm thành viên thành công!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // --- CẬP NHẬT HỒ SƠ ---
    updateProfile: async (req, res) => {
        try {
            const { username, avatar } = req.body;
            const userId = req.user.id; // Lấy từ token

            // 1. Validate cơ bản
            if (!username) return res.status(400).json({ err: "Tên người dùng không được để trống." });
            if (username.length < 6) return res.status(400).json({ err: "Tên người dùng phải có ít nhất 6 ký tự." });

            // 2. Kiểm tra xem Username có bị trùng với người khác không?
            // Tìm user có username này, NHƯNG không phải là chính mình ($ne: not equal)
            const userExists = await Users.findOne({ 
                username: username, 
                _id: { $ne: userId } 
            });

            if (userExists) {
                return res.status(400).json({ err: "Tên người dùng này đã có người sử dụng." });
            }

            // 3. Cập nhật
            const updatedUser = await Users.findByIdAndUpdate(userId, {
                username: username,
                avatar: avatar
            }, { new: true }).select("-password"); // Trả về user mới, trừ pass

            res.json({ msg: "Cập nhật thành công!", user: updatedUser });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default userCtrl;