// File: Maneasily/server/src/controllers/taskCtrl.js

import Tasks from "../models/taskModel.js";
import Columns from "../models/columnModel.js";

// Tham khảo logic từ WQLCV
const taskCtrl = {
    createTask: async (req, res) => {
        try {
            // Lấy title và columnId từ frontend gửi lên
            const { title, columnId, projectId } = req.body;

            // 1. Tạo một Task mới
            const newTask = new Tasks({
                title: title,
                dec: "Nhấp vào để thêm mô tả...", // Giá trị mặc định
                color: "default", // Giá trị mặc định
                tag: "New", // Giá trị mặc định
                column: columnId,
                project: projectId
            });
            await newTask.save();

            // 2. Cập nhật Cột (Column) cha
            await Columns.findByIdAndUpdate(columnId, {
                $push: { 
                    tasks: newTask._id, // Thêm ID task mới vào mảng 'tasks'
                    taskOrder: newTask._id // Thêm ID task mới vào 'taskOrder'
                }
            });

            // 3. Trả task mới về cho frontend để render
            res.json({ task: newTask });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
};

export default taskCtrl;