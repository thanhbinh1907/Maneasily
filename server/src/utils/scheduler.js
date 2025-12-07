import cron from 'node-cron';
import Tasks from '../models/taskModel.js';
import Users from '../models/userModel.js';
import { sendEmail } from './emailUtils.js';

export const startScheduler = () => {
    console.log('⏳ Hệ thống nhắc nhở deadline đã khởi động...');

    // --- JOB 1: QUÉT THEO NGÀY (Chạy mỗi sáng lúc 7:00 AM) ---
    cron.schedule('0 7 * * *', async () => {
        try {
            console.log('📅 Đang quét deadline hàng ngày...');
            const now = new Date();
            
            // Tìm task chưa xong và có deadline
            const tasks = await Tasks.find({
                deadline: { $gt: now }, // Hạn chưa qua
                column: { $ne: 'DONE_COLUMN_ID' } // (Lưu ý: Bạn cần logic để biết cột nào là Done)
            }).populate('members');

            for (const task of tasks) {
                // Tính còn bao nhiêu ngày nữa (làm tròn lên)
                const diffTime = new Date(task.deadline) - now;
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Kiểm tra xem hôm nay đã gửi mail task này chưa
                const lastSent = task.reminderHistory?.lastDailySent;
                const isSentToday = lastSent && new Date(lastSent).toDateString() === now.toDateString();

                if (isSentToday) continue; // Nếu gửi rồi thì bỏ qua

                for (const member of task.members) {
                    // Kiểm tra cấu hình của từng user
                    const settings = member.settings?.notifications?.deadlineReminder;
                    
                    // Nếu user bật nhắc nhở VÀ số ngày còn lại <= số ngày họ cài đặt
                    if (settings?.enabled && daysLeft <= settings.daysBefore) {
                        await sendEmail(
                            member.email,
                            `📅 [Nhắc nhở] "${task.title}" hết hạn sau ${daysLeft} ngày`,
                            `<p>Xin chào <b>${member.username}</b>,</p>
                             <p>Công việc <b>${task.title}</b> còn ${daysLeft} ngày nữa là đến hạn (${new Date(task.deadline).toLocaleDateString()}).</p>
                             <p>Hãy hoàn thành sớm nhé!</p>`
                        );
                        
                        // Đánh dấu là đã gửi hôm nay
                        await Tasks.findByIdAndUpdate(task._id, {
                            'reminderHistory.lastDailySent': now
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi Daily Cron:', err);
        }
    });

    // --- JOB 2: QUÉT THEO GIỜ (Chạy mỗi 30 phút) ---
    cron.schedule('*/30 * * * *', async () => {
        try {
            const now = new Date();
            
            // Tìm task sắp hết hạn trong 24h tới mà chưa gửi nhắc giờ
            const tasks = await Tasks.find({
                deadline: { $gt: now },
                'reminderHistory.isHourlySent': false // Chưa gửi nhắc khẩn cấp
            }).populate('members');

            for (const task of tasks) {
                const diffTime = new Date(task.deadline) - now;
                const hoursLeft = diffTime / (1000 * 60 * 60); // Đổi ra giờ

                for (const member of task.members) {
                    const settings = member.settings?.notifications?.deadlineReminder;

                    // Nếu số giờ còn lại <= số giờ họ cài đặt (Ví dụ: còn 1.5 giờ, cài đặt 2 giờ -> Gửi)
                    if (settings?.enabled && hoursLeft <= settings.hoursBefore) {
                        await sendEmail(
                            member.email,
                            `🚨 [KHẨN CẤP] "${task.title}" sắp hết hạn!`,
                            `<p>Xin chào <b>${member.username}</b>,</p>
                             <p>Chỉ còn <b>${hoursLeft.toFixed(1)} giờ</b> nữa là hết hạn công việc <b>${task.title}</b>.</p>
                             <p>Vui lòng kiểm tra ngay!</p>`
                        );

                        // Đánh dấu đã gửi nhắc khẩn cấp (chỉ gửi 1 lần duy nhất)
                        await Tasks.findByIdAndUpdate(task._id, {
                            'reminderHistory.isHourlySent': true
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi Hourly Cron:', err);
        }
    });
};