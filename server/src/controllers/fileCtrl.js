import { Folders, Files } from "../models/fileModel.js";
import path from 'path';
import fs from 'fs';

const fileCtrl = {
    // 1. Lấy nội dung của Task (hoặc của 1 folder con)
    getContent: async (req, res) => {
        try {
            const { taskId } = req.params;
            const { folderId } = req.query; // Nếu null -> lấy gốc

            // Điều kiện lọc
            const query = { task: taskId, parent: folderId || null };
            const fileQuery = { task: taskId, folder: folderId || null };

            const folders = await Folders.find(query).sort({ createdAt: -1 });
            const files = await Files.find(fileQuery).sort({ createdAt: -1 });

            // Nếu đang ở folder con, lấy thông tin folder hiện tại để làm Breadcrumb
            let currentFolder = null;
            if (folderId) {
                currentFolder = await Folders.findById(folderId);
            }

            res.json({ folders, files, currentFolder });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // 2. Tạo Folder mới
    createFolder: async (req, res) => {
        try {
            const { name, taskId, parentId } = req.body;
            const newFolder = new Folders({
                name,
                task: taskId,
                parent: parentId || null,
                creator: req.user.id
            });
            await newFolder.save();
            res.json({ folder: newFolder });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // 3. Upload File
    uploadFile: async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ err: "Không có file nào được gửi." });

            const { taskId, folderId } = req.body;
            
            const newFile = new Files({
                originalName: req.file.originalname,
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size,
                task: taskId,
                folder: folderId === 'null' || folderId === 'undefined' ? null : folderId,
                uploader: req.user.id
            });

            await newFile.save();
            res.json({ file: newFile });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // 4. Xóa Folder (Xóa đệ quy đơn giản hoặc chặn nếu có con - ở đây làm đơn giản là xóa ref)
    deleteItem: async (req, res) => {
        try {
            const { type, id } = req.params; // type: 'file' hoặc 'folder'
            if (type === 'file') {
                const file = await Files.findById(id);
                if (file) {
                    // Xóa file vật lý
                    try { fs.unlinkSync(file.path); } catch(e) {}
                    await Files.findByIdAndDelete(id);
                }
            } else {
                // Xóa folder (Cần cẩn thận xóa cả con bên trong - Để đơn giản ta chỉ xóa folder DB, file con sẽ bị mồ côi hoặc cần logic đệ quy)
                await Folders.findByIdAndDelete(id);
                // (Tốt nhất nên xóa tất cả file/folder có parent là id này)
                await Files.deleteMany({ folder: id });
                await Folders.deleteMany({ parent: id });
            }
            res.json({ msg: "Đã xóa!" });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default fileCtrl;