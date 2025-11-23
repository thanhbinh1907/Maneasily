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
    }
};

export default userCtrl;