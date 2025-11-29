import Columns from "../models/columnModel.js";
import Projects from "../models/projectModel.js";
import Tasks from "../models/taskModel.js";

// Hàm phụ check quyền (Copy logic giống bên taskCtrl)
const checkProjectAdmin = async (projectId, userId) => {
    const project = await Projects.findById(projectId);
    if (!project) return false;
    return (project.userOwner.toString() === userId) || (project.admins.includes(userId));
};

const columnCtrl = {
    // --- 1. TẠO CỘT (CẬP NHẬT SOCKET) ---
    createColumn: async (req, res) => {
        try {
            const { title, projectId } = req.body;
            const userId = req.user.id;

            if (!(await checkProjectAdmin(projectId, userId))) {
                return res.status(403).json({ err: "Chỉ quản lý mới được thêm cột." });
            }

            const newColumn = new Columns({
                title, project: projectId, tasks: [], taskOrder: []
            });
            await newColumn.save();
            await logActivity(req, projectId, "created column", title, "đã thêm danh sách mới", "column");

            await Projects.findByIdAndUpdate(projectId, {
                $push: { columns: newColumn._id, columnOrder: newColumn._id }
            });
            
            // [MỚI] Gửi Socket báo cho mọi người biết có cột mới
            req.io.to(projectId).emit('boardUpdated', {
                msg: 'Column created',
                updaterId: userId
            });
            
            res.json({ column: newColumn });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 2. CẬP NHẬT CỘT (Kéo thả Task) ---
    // Hàm này dùng cho cả việc:
    // - Kéo task từ cột A sang B
    // - Sắp xếp lại thứ tự task trong cột
    updateColumn: async (req, res) => {
        try {
            const { idColumn, idColumnNew, idTask, taskOrder, taskOrderNew } = req.body;
            const userId = req.user.id;

            const column = await Columns.findById(idColumn);
            if (!column) return res.status(404).json({ err: "Cột không tồn tại" });

            if (!(await checkProjectAdmin(column.project, userId))) {
                return res.status(403).json({ err: "Thành viên không được thay đổi trạng thái task." });
            }

            // [SỬA ĐOẠN NÀY]
            if (idColumn === idColumnNew) {
                // Kéo thả trong cùng 1 cột
                await Columns.findByIdAndUpdate(idColumn, { taskOrder: taskOrderNew });
                // ❌ XÓA DÒNG return res.json(...) Ở ĐÂY ĐI
            } else {
                // Kéo sang cột khác
                await Columns.findByIdAndUpdate(idColumn, {
                    $pull: { tasks: idTask },
                    taskOrder: taskOrder,
                });
                await Columns.findByIdAndUpdate(idColumnNew, {
                    $push: { tasks: idTask },
                    taskOrder: taskOrderNew,
                });
                await Tasks.findByIdAndUpdate(idTask, { column: idColumnNew });
            }

            // ✅ CODE CHẠY XUỐNG ĐÂY ĐỂ GỬI SOCKET
            req.io.to(column.project.toString()).emit('boardUpdated', {
                msg: 'Board has changed',
                updaterId: userId 
            });

            return res.json({ msg: "Đã cập nhật vị trí!" }); // ✅ TRẢ VỀ KẾT QUẢ Ở CUỐI CÙNG

        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 3. SỬA TÊN CỘT ---
    updateColumnTitle: async (req, res) => {
        try {
            const { title } = req.body;
            const columnId = req.params.id;
            const userId = req.user.id;

            const column = await Columns.findById(columnId);
            if (!(await checkProjectAdmin(column.project, userId))) {
                return res.status(403).json({ err: "Bạn không có quyền sửa tên cột." });
            }

            await Columns.findByIdAndUpdate(columnId, { title });
            await logActivity(req, column.project, "renamed column", title, `đã đổi tên danh sách thành "${title}"`, "column");

            req.io.to(column.project.toString()).emit('boardUpdated', {
                msg: 'Column title updated', updaterId: req.user.id
            });
            res.json({ msg: "Cập nhật thành công!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    },

    // --- 4. XÓA CỘT ---
    deleteColumn: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const column = await Columns.findById(id);
            if (!column) return res.status(404).json({err: "Cột không tồn tại"});

            // Check quyền
            if (!(await checkProjectAdmin(column.project, userId))) {
                return res.status(403).json({ err: "Bạn không có quyền xóa cột." });
            }

            // Xóa sạch dữ liệu liên quan
            await Tasks.deleteMany({ column: id }); // Xóa tasks con
            
            await Projects.findByIdAndUpdate(column.project, {
                $pull: { columns: id, columnOrder: id } // Xóa ref từ Project
            });

            await Columns.findByIdAndDelete(id); // Xóa chính nó

            req.io.to(column.project.toString()).emit('boardUpdated', {
                msg: 'Column deleted', updaterId: req.user.id
            });
            await logActivity(req, column.project, "deleted column", column.title, "đã xóa danh sách", "column");
            res.json({ msg: "Đã xóa cột thành công!" });
        } catch (err) { return res.status(500).json({ err: err.message }); }
    }
};

export default columnCtrl;