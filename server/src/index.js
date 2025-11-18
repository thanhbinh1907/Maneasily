import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; 
import projectRouter from './routers/projectRouter.js';
import authRouter from './routers/authRouter.js';
import session from 'express-session'; 
import passport from 'passport';       
import './config/passport.js';         

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- KẾT NỐI MONGODB ---
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ Đã kết nối CSDL MongoDB!'))
  .catch(err => console.error('❌ Lỗi kết nối CSDL:', err));
// ------------------------

const PORT = process.env.PORT || 5000;

app.get('/api/test', (req, res) => {
    res.json({ message: 'Server Maneasily đã chạy và kết nối CSDL (nếu không có lỗi ở trên)!' });
});

// --- CẤU HÌNH SESSION & PASSPORT ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
// -----------------------------------

// --- API ROUTERS ---
app.use('/api', projectRouter);
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
    console.log(`Server Maneasily đang chạy ở http://localhost:${PORT}`);
});