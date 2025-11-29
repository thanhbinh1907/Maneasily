import Activities from "../models/activityModel.js";
import Users from "../models/userModel.js";
import Projects from "../models/projectModel.js";

const activityCtrl = {
    // Lấy danh sách hoạt động, chia theo Project và sắp xếp theo User Setting
    getDashboard: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await Users.findById(userId);

            // 1. Lấy tất cả dự án user tham gia
            const projects = await Projects.find({ members: userId }).select("title img");
            
            // 2. Lấy hoạt động của các dự án này (Giới hạn 20 tin mới nhất mỗi dự án cho nhẹ)
            // Cách tối ưu: Aggregate hoặc query song song. Ở đây dùng map cho đơn giản.
            const boardData = await Promise.all(projects.map(async (p) => {
                const logs = await Activities.find({ project: p._id })
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .populate("user", "username avatar");
                
                return {
                    project: p,
                    activities: logs
                };
            }));

            // 3. Sắp xếp theo User Preferences (Ghim lên đầu, sau đó theo Order)
            const pinnedIds = user.activitySettings?.pinnedProjects?.map(id => id.toString()) || [];
            const orderIds = user.activitySettings?.projectOrder?.map(id => id.toString()) || [];

            // Hàm tính điểm để sort: Pinned = 2, InOrder = 1 (index nghịch đảo), Còn lại = 0
            boardData.sort((a, b) => {
                const idA = a.project._id.toString();
                const idB = b.project._id.toString();

                const isPinA = pinnedIds.includes(idA);
                const isPinB = pinnedIds.includes(idB);

                if (isPinA && !isPinB) return -1;
                if (!isPinA && isPinB) return 1;
                
                // Nếu cùng ghim hoặc cùng không ghim, xét theo thứ tự custom
                const indexA = orderIds.indexOf(idA);
                const indexB = orderIds.indexOf(idB);
                
                // Nếu cả 2 đều có trong order list
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                // Nếu A có, B không -> A lên trước
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                
                return 0; // Giữ nguyên
            });

            res.json({ boardData, pinnedIds });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // Lưu thứ tự và trạng thái ghim
    savePreferences: async (req, res) => {
        try {
            const { pinnedProjects, projectOrder } = req.body;
            await Users.findByIdAndUpdate(req.user.id, {
                activitySettings: { pinnedProjects, projectOrder }
            });
            res.json({ msg: "Đã lưu sắp xếp!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    
    // Lấy thêm log (phân trang khi zoom to)
    getMoreActivities: async (req, res) => {
        try {
            const { projectId, skip } = req.query;
            const logs = await Activities.find({ project: projectId })
                .sort({ createdAt: -1 })
                .skip(parseInt(skip))
                .limit(20)
                .populate("user", "username avatar");
            res.json({ activities: logs });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default activityCtrl;