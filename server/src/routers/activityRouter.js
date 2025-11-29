import express from 'express';
import auth from '../middleware/auth.js';
import activityCtrl from '../controllers/activityCtrl.js';

const router = express.Router();

router.get('/activity/dashboard', auth, activityCtrl.getDashboard);
router.post('/activity/preferences', auth, activityCtrl.savePreferences);
router.get('/activity/logs', auth, activityCtrl.getMoreActivities);

export default router;