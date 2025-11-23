// File: Maneasily/server/src/routers/projectRouter.js

import express from 'express';
import projectCtrl from '../controllers/projectCtrl.js';
import columnCtrl from '../controllers/columnCtrl.js';
import taskCtrl from '../controllers/taskCtrl.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// --- Routes cho PROJECT ---
router.get('/project/:id', projectCtrl.getProject); // Lấy 1 project
router.patch('/project/:id/columnorder', projectCtrl.updateColumnOrder); // Update cột

// --- Tạo project mới ---
router.post('/project', projectCtrl.createProject); // Tạo project
router.get('/projects', projectCtrl.getUserProjects); // Lấy danh sách project của user

// --- Routes cho COLUMN & TASK ---
router.patch('/column', columnCtrl.updateColumn); 
router.post('/task', taskCtrl.createTask);
router.post('/column', columnCtrl.createColumn);

router.patch('/projects/order', projectCtrl.updateProjectOrder); //update project 
router.delete('/project/:id', projectCtrl.deleteProject); //delete project

// Route lấy link mời (Chỉ thành viên dự án mới lấy được - ở đây tạm dùng auth)
router.get('/project/:id/invite', auth, projectCtrl.getInviteLink);
// Route tham gia dự án (User bấm link)
router.post('/project/join', auth, projectCtrl.joinProjectByLink);

export default router;