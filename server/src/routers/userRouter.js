import express from 'express';
import userCtrl from '../controllers/userCtrl.js';
import auth from '../middleware/auth.js'; // Import middleware xác thực

const router = express.Router();

// Route tìm kiếm người dùng (Yêu cầu đăng nhập)
router.get('/search', auth, userCtrl.searchUsers);

// Route thêm thành viên vào dự án (Yêu cầu đăng nhập)
router.post('/add-member', auth, userCtrl.addMemberToProject);

export default router;