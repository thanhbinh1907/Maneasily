// File: Maneasily/server/src/controllers/columnCtrl.js

import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js"; // <-- BẠN BỊ THIẾU DÒNG NÀY

const columnCtrl = {
    // --- BẠN BỊ THIẾU TOÀN BỘ HÀM NÀY ---
    // (Tham khảo logic từ WQLCV)
    createColumn: async (req, res) => {
        try {
            const { title, projectId } = req.body;

            // 1. Tạo Cột mới
            const newColumn = new Columns({
                title: title,
                project: projectId,
                tasks: [],
                taskOrder: []
            });
            await newColumn.save(); // <-- Code của bạn chỉ chạy đến đây

            // 2. Cập nhật Project (Board) cha (BƯỚC BỊ LỖI)
            await Projects.findByIdAndUpdate(projectId, {
                $push: {
                    columns: newColumn._id, // Thêm ID cột mới vào mảng 'columns'
                    columnOrder: newColumn._id // Thêm ID cột mới vào 'columnOrder'
                }
            });
            
            // 3. Trả cột mới về cho frontend
            res.json({ column: newColumn });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    // ------------------------------------

    updateColumn: async (req, res) => {
        // ... (hàm updateColumn của bạn giữ nguyên)
        try {
            const {
                idColumn, idColumnNew, idTask, taskOrder, taskOrderNew,
            } = req.body;

            if (idColumn === idColumnNew) {
                await Columns.findByIdAndUpdate(idColumn, {
                    taskOrder: taskOrderNew,
                });
                return res.json({ msg: "Đã cập nhật thứ tự task trong cột!" });
            }

            await Columns.findByIdAndUpdate(idColumn, {
                $pull: { tasks: idTask },
                taskOrder: taskOrder,
            });

            await Columns.findByIdAndUpdate(idColumnNew, {
                $push: { tasks: idTask },
                taskOrder: taskOrderNew,
            });

            return res.json({ msg: "Đã di chuyển task sang cột mới!" });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
};

export default columnCtrl;