import Projects from "../models/projectModel.js";
import Tasks from "../models/taskModel.js";

const searchCtrl = {
    searchGlobal: async (req, res) => {
        try {
            const { q } = req.query; // Từ khóa
            const userId = req.user.id;

            if (!q || q.trim() === '') return res.json({ projects: [], tasks: [] });

            // 1. Tìm Dự án (User là thành viên và tên/mô tả khớp từ khóa)
            const projects = await Projects.find({
                members: userId,
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { dec: { $regex: q, $options: 'i' } }
                ]
            }).select("title img").limit(5);

            // 2. Tìm Task (User là thành viên của task HOẶC thành viên dự án chứa task)
            // Để đơn giản và nhanh, ta tìm các task mà user được assign hoặc task nằm trong dự án user tham gia
            // Ở đây mình tìm theo: Task mà user là thành viên
            const tasks = await Tasks.find({
                members: userId,
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { dec: { $regex: q, $options: 'i' } }
                ]
            })
            .populate("project", "title") // Lấy thêm tên dự án để hiển thị
            .select("title project deadline")
            .limit(5);

            res.json({ projects, tasks });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default searchCtrl;