import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose'; 
import projectRouter from './routers/projectRouter.js';

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

// --- API ROUTERS ---
app.use('/api', projectRouter);

app.listen(PORT, () => {
    console.log(`Server Maneasily đang chạy ở http://localhost:${PORT}`);
});