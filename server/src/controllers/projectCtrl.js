import Projects from "../models/projectModel.js";
import Columns from "../models/columnModel.js";
import Tasks from "../models/taskModel.js";
// (Chúng ta sẽ cần 3 model này)

const projectCtrl = {
    // Hàm này lấy 1 project VÀ tất cả dữ liệu bên trong nó
    getProject: async (req, res) => {
        try {
            const { id } = req.params;

            // 1. Tìm Project bằng ID
            // 2. Dùng .populate() để thay thế các ID trong 'columns'
            //    bằng dữ liệu Cột (Column) đầy đủ
            // 3. Dùng .populate() sâu hơn (nested) để thay thế
            //    ID 'tasks' bên trong Cột bằng dữ liệu Task đầy đủ
            const project = await Projects.findById(id).populate({
                path: "columns",
                populate: {
                    path: "tasks",
                    model: "tasks",
                },
            });

            if (!project) {
                return res.status(404).json({ err: "Không tìm thấy project" });
            }

            res.json({ project });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
};

export default projectCtrl;