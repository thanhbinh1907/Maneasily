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
router.post('/project', projectCtrl.createProject); // Tạo project
router.get('/projects', projectCtrl.getUserProjects); // Lấy danh sách project của user
router.patch('/projects/order', projectCtrl.updateProjectOrder); //update project 
router.delete('/project/:id', projectCtrl.deleteProject); //delete project 

// --- Routes cho COLUMN & TASK ---
// Task
router.post('/task', auth, taskCtrl.createTask); // Có auth
router.delete('/task/:id', auth, taskCtrl.deleteTask); // Có auth
// Column
router.post('/column', auth, columnCtrl.createColumn); // Có auth
router.patch('/column', auth, columnCtrl.updateColumn); // Có auth (Chặn kéo thả)
router.put('/column/:id', auth, columnCtrl.updateColumnTitle); // Có auth
router.delete('/column/:id', auth, columnCtrl.deleteColumn); // Có auth

// Route lấy link mời và tham gia dự án 
router.get('/project/:id/invite', auth, projectCtrl.getInviteLink);
router.post('/project/join', auth, projectCtrl.joinProjectByLink);

// Quản lý thành viên dự án
router.put('/project/promote', auth, projectCtrl.promoteToManager);
router.put('/project/demote', auth, projectCtrl.demoteToMember);
router.put('/project/remove-member', auth, projectCtrl.removeMember);

// TASK DETAIL & UPDATE
router.get('/task/:id', auth, taskCtrl.getTaskDetail);
router.put('/task/:id', auth, taskCtrl.updateTask);
router.put('/task/:id/remove-member', auth, taskCtrl.removeMember);

// SUBTASKS (WORKS)
router.post('/task/work', auth, taskCtrl.addWork);
router.put('/task/work/:workId', auth, taskCtrl.toggleWork);
router.get('/tasks/overdue', auth, taskCtrl.getOverdueTasks);
router.delete('/task/work/:workId', auth, taskCtrl.deleteWork);
router.put('/task/work/:workId/toggle-member', auth, taskCtrl.toggleWorkMember);

// COMMENTS
router.post('/task/comment', auth, taskCtrl.addComment);

export default router;