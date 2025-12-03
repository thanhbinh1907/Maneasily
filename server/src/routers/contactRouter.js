// server/src/routers/contactRouter.js
import express from 'express';
import contactCtrl from '../controllers/contactCtrl.js';

const router = express.Router();

// Định nghĩa route POST /api/contact
router.post('/contact', contactCtrl.sendContactEmail);

export default router;