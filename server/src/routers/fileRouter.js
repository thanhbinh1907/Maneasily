import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // Thêm dòng này để lấy đường dẫn tuyệt đối chuẩn ES Module
import auth from '../middleware/auth.js';
import fileCtrl from '../controllers/fileCtrl.js';

const router = express.Router();

// --- CẤU HÌNH ĐƯỜNG DẪN TUYỆT ĐỐI ---
// Lấy đường dẫn của file hiện tại (fileRouter.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo đường dẫn đến thư mục uploads nằm ở root của server (ngang hàng src)
// Đi ra ngoài 2 cấp (routers -> src -> server root)
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Đảm bảo thư mục tồn tại ngay khi khởi chạy
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log("📂 Đã tạo thư mục uploads tại:", UPLOAD_DIR);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        // Xử lý tên file an toàn (giữ đuôi file, thay ký tự lạ bằng _)
        // Sửa lỗi font tiếng Việt khi lưu file
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

// Giới hạn file 10MB
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Routes
router.get('/task/:taskId/files', auth, fileCtrl.getContent);
router.post('/folder', auth, fileCtrl.createFolder);
router.post('/file', auth, upload.single('file'), fileCtrl.uploadFile);
router.delete('/item/:type/:id', auth, fileCtrl.deleteItem);

export default router;