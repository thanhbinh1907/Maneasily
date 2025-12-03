// File: Maneasily/server/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http'; // Cần thiết cho Socket.io
import { Server } from 'socket.io'; // Cần thiết cho Socket.io

// Imports Router
import projectRouter from './routers/projectRouter.js';
import authRouter from './routers/authRouter.js';
import userRouter from './routers/userRouter.js';
import notificationRouter from './routers/notificationRouter.js';
import './routers/activityRouter.js';

import session from 'express-session';
import passport from 'passport';
import './config/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Cấu hình Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173", // URL Client của bạn
        methods: ["GET", "POST"]
    }
});

// Danh sách user đang online
let onlineUsers = [];

io.on('connection', (socket) => {
    // Khi client gửi sự kiện 'join' (lúc đăng nhập)
    socket.on('join', (userId) => {
        if (!onlineUsers.some(u => u.userId === userId)) {
            onlineUsers.push({ userId, socketId: socket.id });
        }
    });

    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter(u => u.socketId !== socket.id);
    });

    socket.on('joinBoard', (projectId) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined board: ${projectId}`);
    });

    socket.on('leaveBoard', (projectId) => {
        socket.leave(projectId);
    });
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Chỉ cho phép Frontend gọi
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"], // QUAN TRỌNG: Cho phép header Authorization
  credentials: true
}));

app.use(express.json());

// 2. [QUAN TRỌNG] Middleware gắn io vào req 
// (Phải đặt TRƯỚC các app.use Router bên dưới)
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

// 3. Kết nối Database
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ Đã kết nối MongoDB'))
  .catch(err => console.error('❌ Lỗi kết nối DB:', err));

// 4. Cấu hình Session & Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// 5. Khai báo Routes (Sau khi đã gắn middleware socket)
app.use('/api', projectRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api', notificationRouter);

// 6. Khởi động Server bằng 'server.listen' (Không dùng app.listen)
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});