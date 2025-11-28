// File: Maneasily/server/src/utils/emailUtils.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: `"Maneasily Support" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log(`✅ Email đã gửi đến: ${to}`);
    } catch (err) {
        console.error("❌ Lỗi gửi email:", err.message);
        // Không throw lỗi để tránh crash server nếu gửi mail thất bại
    }
};