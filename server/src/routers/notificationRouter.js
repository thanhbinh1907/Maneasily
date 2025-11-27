import express from 'express';
import auth from '../middleware/auth.js';
import notificationCtrl from '../controllers/notificationCtrl.js';

const router = express.Router();

router.get('/notifications', auth, notificationCtrl.getNotifications);
router.patch('/notification/:id/read', auth, notificationCtrl.markRead);
router.delete('/notification/:id', auth, notificationCtrl.deleteNotification);
router.patch('/notifications/read-all', auth, notificationCtrl.markAllRead);

export default router;