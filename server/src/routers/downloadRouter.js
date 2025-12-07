import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Route: GET /api/download/windows
router.get('/download/windows', (req, res) => {
    // Đường dẫn đến file .exe
    const filePath = path.join(process.cwd(), 'uploads', 'apps', 'Maneasily-Setup.exe');

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ err: "File cài đặt chưa được tải lên Server." });
    }

    // Tự động tải xuống với tên file gốc
    res.download(filePath, 'Maneasily-Setup.exe', (err) => {
        if (err) {
            console.error("Lỗi download:", err);
            if (!res.headersSent) {
                res.status(500).send("Lỗi Server khi tải file.");
            }
        }
    });
});

export default router;