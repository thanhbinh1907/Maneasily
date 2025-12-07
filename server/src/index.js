// File: Maneasily/server/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path'; 

// Imports Router
import projectRouter from './routers/projectRouter.js';
import authRouter from './routers/authRouter.js';
import userRouter from './routers/userRouter.js';
import notificationRouter from './routers/notificationRouter.js';
import contactRouter from './routers/contactRouter.js';
import activityRouter from './routers/activityRouter.js';
import fileRouter from './routers/fileRouter.js';
import searchRouter from './routers/searchRouter.js';

import session from 'express-session';
import passport from 'passport';
import { startScheduler } from './utils/scheduler.js';
import './config/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. Cấu hình Socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

let onlineUsers = [];

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        // [SỬA LỖI QUAN TRỌNG]
        // Xóa kết nối cũ của user này (nếu có) để cập nhật socket.id mới nhất
        onlineUsers = onlineUsers.filter(u => u.userId !== userId);
        
        // Thêm kết nối mới vào danh sách
        onlineUsers.push({ userId, socketId: socket.id });
        
        console.log(`✅ User ${userId} đã online với Socket ID: ${socket.id}`);
    });

    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter(u => u.socketId !== socket.id);
        console.log(`❌ Socket ID ${socket.id} đã ngắt kết nối.`);
    });

    socket.on('joinBoard', (projectId) => {
        socket.join(projectId);
    });

    socket.on('leaveBoard', (projectId) => {
        socket.leave(projectId);
    });
});

// --- 2. Middleware Quan Trọng (Phải đặt trước Routes) ---

// CORS: Cho phép client truy cập
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Body Parser: Để Server hiểu dữ liệu JSON gửi lên (QUAN TRỌNG CHO UPLOAD FILE & POST DATA)
app.use(express.json());

// Static Files: Để hiển thị ảnh/file đã upload (QUAN TRỌNG ĐỂ XEM ẢNH)
// Dùng process.cwd() để lấy đường dẫn gốc chính xác
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Inject Socket.io vào request để dùng trong Controller
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

// Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// --- 3. Kết nối Database ---
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch(err => console.error('❌ Lỗi kết nối DB:', err));

// --- 4. Khai báo Routes (Đặt sau cùng) ---
app.use('/api', projectRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api', notificationRouter);
app.use('/api', contactRouter);
app.use('/api', activityRouter);
app.use('/api', fileRouter);
app.use('/api', searchRouter);

startScheduler();

// --- 5. Khởi động Server ---
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});