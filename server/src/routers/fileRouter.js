import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import auth from '../middleware/auth.js';
import fileCtrl from '../controllers/fileCtrl.js';

const router = express.Router();

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // Tạo thư mục nếu chưa có
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Đặt tên file unique: timestamp + tên gốc
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
router.get('/task/:taskId/files', auth, fileCtrl.getContent);
router.post('/folder', auth, fileCtrl.createFolder);
router.post('/file', auth, upload.single('file'), fileCtrl.uploadFile);
router.delete('/item/:type/:id', auth, fileCtrl.deleteItem);

export default router;