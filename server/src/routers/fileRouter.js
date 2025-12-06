import express from 'express';
import multer from 'multer';
import path from 'path'; // Nhớ import path
import fs from 'fs';
import auth from '../middleware/auth.js';
import fileCtrl from '../controllers/fileCtrl.js';

const router = express.Router();

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // [SỬA] Dùng đường dẫn tuyệt đối để tránh lỗi không tìm thấy thư mục
        const uploadDir = path.join(process.cwd(), 'uploads');
        
        // Tạo thư mục nếu chưa có
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Xử lý tên file an toàn (bỏ ký tự đặc biệt)
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ storage: storage });

// Routes
router.get('/task/:taskId/files', auth, fileCtrl.getContent);
router.post('/folder', auth, fileCtrl.createFolder);
router.post('/file', auth, upload.single('file'), fileCtrl.uploadFile);
router.delete('/item/:type/:id', auth, fileCtrl.deleteItem);

export default router;