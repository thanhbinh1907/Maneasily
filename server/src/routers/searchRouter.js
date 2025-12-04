// File: server/src/routers/searchRouter.js
import express from 'express';
import auth from '../middleware/auth.js';
import searchCtrl from '../controllers/searchCtrl.js';

const router = express.Router();

router.get('/search/global', auth, searchCtrl.searchGlobal);

export default router;