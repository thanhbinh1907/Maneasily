// File: Maneasily/server/src/controllers/userCtrl.js
import Users from "../models/userModel.js";
import Projects from "../models/projectModel.js";

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
            const { projectId, userId } = req.body;

            // 1. Cập nhật Project
            const project = await Projects.findByIdAndUpdate(projectId, {
                $addToSet: { members: userId } 
            }, { new: true });

            // 2. Cập nhật User
            await Users.findByIdAndUpdate(userId, {
                $addToSet: { projects: projectId }
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