// File: Maneasily/server/src/routers/projectRouter.js

import express from 'express';
import projectCtrl from '../controllers/projectCtrl.js';
import columnCtrl from '../controllers/columnCtrl.js';
import taskCtrl from '../controllers/taskCtrl.js'; // <-- BẠN BỊ THIẾU DÒNG NÀY

const router = express.Router();

// Route (GET)
router.get('/project/:id', projectCtrl.getProject);

// Routes (PATCH)
router.patch('/column', columnCtrl.updateColumn); 
router.patch('/project/:id/columnorder', projectCtrl.updateColumnOrder);

// --- BẠN BỊ THIẾU 2 ROUTES (POST) NÀY ---
router.post('/task', taskCtrl.createTask);
router.post('/column', columnCtrl.createColumn);
// ----------------------------------------

export default router;