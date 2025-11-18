import express from 'express';
import authCtrl from '../controllers/authCtrl.js';
import passport from 'passport';

const router = express.Router();

// POST /api/auth/register
router.post('/register', authCtrl.register);

// GET /api/auth/verify-email
router.get('/verify-email', authCtrl.verifyEmail);

// POST /api/auth/login
router.post('/login', authCtrl.login);

// 1. Khi user bấm nút "Login Google" -> Gọi route này để chuyển sang trang Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Khi Google xác thực xong -> Gọi route này để server xử lý và cấp token
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    authCtrl.googleCallback
);
export default router;