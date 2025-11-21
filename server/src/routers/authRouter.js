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
// POST /api/auth/forgot-password
router.post('/forgot-password', authCtrl.forgotPassword);
// POST /api/auth/reset-password
router.post('/reset-password', authCtrl.resetPassword);

// 1. Router kích hoạt
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// 2. Router callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    authCtrl.googleCallback
);
router.get('/github/callback', 
    passport.authenticate('github', { failureRedirect: '/' }),
    authCtrl.googleCallback // Dùng lại hàm callback chung
);

export default router;