import express from 'express';
import projectCtrl from '../controllers/projectCtrl.js';

const router = express.Router();

// Khi ai đó truy cập (GET) /api/project/:id
// nó sẽ chạy hàm projectCtrl.getProject
router.get('/project/:id', projectCtrl.getProject);

export default router;