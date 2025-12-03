import nodemailer from "nodemailer";

const contactCtrl = {
    sendContactEmail: async (req, res) => {
        try {
            const { name, email, subject, message } = req.body;

            // 1. Validate dữ liệu
            if (!name || !email || !message) {
                return res.status(400).json({ err: "Vui lòng điền đầy đủ thông tin." });
            }

            // 2. Cấu hình Transporter (Sử dụng lại cấu hình trong .env)
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: false, // true cho port 465
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            // 3. Nội dung email gửi về cho BẠN (Admin)
            const mailOptions = {
                from: `"Maneasily Contact" <${process.env.EMAIL_USER}>`, // Gửi từ chính server
                to: process.env.EMAIL_USER, // Gửi đến email của bạn
                replyTo: email, // Khi bạn bấm Reply, sẽ trả lời vào mail người gửi
                subject: `[Liên hệ mới] ${subject || 'Không có tiêu đề'}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #ff7f32;">Bạn nhận được tin nhắn mới từ Website</h2>
                        <p><strong>Người gửi:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Chủ đề:</strong> ${subject}</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <h3>Nội dung tin nhắn:</h3>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</p>
                    </div>
                `,
            };

            // 4. Gửi mail
            await transporter.sendMail(mailOptions);

            res.json({ msg: "Tin nhắn đã được gửi thành công!" });

        } catch (err) {
            console.error("Lỗi gửi mail liên hệ:", err);
            return res.status(500).json({ err: "Gửi mail thất bại. Vui lòng thử lại sau." });
        }
    }
};

export default contactCtrl;