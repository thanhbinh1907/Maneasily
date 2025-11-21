import Users from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

// --- Hàm trợ giúp gửi Email ---
const sendVerificationEmail = async (user) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const verificationLink = `${process.env.SERVER_URL}/api/auth/verify-email?token=${user.verificationToken}`;

        await transporter.sendMail({
            from: `"Maneasily" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: "Xác nhận tài khoản Maneasily của bạn",
            html: `
                <p>Chào ${user.username},</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại Maneasily.</p>
                <p>Vui lòng nhấp vào đường link dưới đây để kích hoạt tài khoản:</p>
                <a href="${verificationLink}" target="_blank">Kích hoạt tài khoản</a>
                <p>Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>
            `,
        });

        console.log("Email xác nhận đã gửi tới:", user.email);
    } catch (err) {
        console.error("Lỗi gửi email:", err);
    }
};

// --- Controller chính ---
const authCtrl = {
    register: async (req, res) => {
        try {
            const { email, username, password } = req.body;

            // 1. Kiểm tra dữ liệu đầu vào
            if (!email || !username || !password)
                return res.status(400).json({ err: "Vui lòng nhập đủ thông tin." });
            if (password.length < 6)
                return res.status(400).json({ err: "Mật khẩu phải dài ít nhất 6 ký tự." });

            // 2. Kiểm tra user tồn tại
            let user = await Users.findOne({ email });
            if (user)
                return res.status(400).json({ err: "Email này đã tồn tại." });
            
            user = await Users.findOne({ username });
            if (user)
                return res.status(400).json({ err: "Username này đã tồn tại." });

            // 3. Băm mật khẩu
            const passwordHash = await bcrypt.hash(password, 12);

            // 4. Tạo token xác nhận
            const verificationToken = jwt.sign(
                { email },
                process.env.JWT_VERIFY_SECRET,
                { expiresIn: "1h" } // Token hết hạn sau 1 giờ
            );

            // 5. Tạo user mới
            const newUser = new Users({
                email,
                username,
                password: passwordHash,
                verificationToken,
                isVerified: false,
            });

            await newUser.save();

            // 6. Gửi email
            await sendVerificationEmail(newUser);

            res.json({
                msg: "Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.",
            });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            const { token } = req.query;
            if (!token)
                return res.status(400).send("Token không hợp lệ hoặc bị thiếu.");

            // 1. Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_VERIFY_SECRET);
            if (!decoded.email)
                return res.status(400).send("Token không hợp lệ.");

            // 2. Tìm user
            const user = await Users.findOne({
                email: decoded.email,
                verificationToken: token,
            });

            if (!user)
                return res.status(400).send("Token không hợp lệ hoặc đã được sử dụng.");

            // 3. Kích hoạt user
            user.isVerified = true;
            user.verificationToken = undefined; // Xóa token
            await user.save();

            // (Bạn có thể chuyển hướng về trang chủ/login của client)
            res.send("<h1>Xác nhận tài khoản thành công!</h1><p>Bạn có thể đóng tab này và quay lại trang đăng nhập.</p>");

        } catch (err) {
            // Lỗi hết hạn (TokenExpiredError) sẽ được bắt ở đây
            return res.status(500).send("Lỗi xác nhận: " + err.message);
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // 1. Tìm user
            const user = await Users.findOne({ email });
            if (!user)
                return res.status(400).json({ err: "Email hoặc mật khẩu không đúng." });

            // 2. Kiểm tra mật khẩu
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(400).json({ err: "Email hoặc mật khẩu không đúng." });

            // 3. (QUAN TRỌNG) Kiểm tra đã xác nhận email chưa
            if (!user.isVerified) {
                // (Tùy chọn: Gửi lại email nếu user yêu cầu)
                return res.status(401).json({ 
                    err: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email của bạn." 
                });
            }

            // 4. Tạo token đăng nhập (Login Token)
            const loginToken = jwt.sign(
                { id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" } // Token hết hạn sau 7 ngày
            );

            // Không gửi lại mật khẩu
            user.password = undefined;

            res.json({
                msg: "Đăng nhập thành công!",
                token: loginToken,
                user,
            });
        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    googleCallback: async (req, res) => {
        try {
            // Khi passport xác thực xong, user sẽ nằm trong req.user
            if (!req.user) {
                return res.status(400).json({ err: "Không tìm thấy thông tin người dùng Google." });
            }

            // Tạo Token đăng nhập (giống hệt hàm login)
            const loginToken = jwt.sign(
                { id: req.user._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            // QUAN TRỌNG: Vì đây là chuyển hướng (Redirect) từ server về client,
            // ta không thể trả về JSON như bình thường.
            // Ta phải chuyển hướng trình duyệt về trang chủ Client kèm theo Token trên URL.
            
            // URL Client (Frontend) - Đổi port nếu frontend bạn chạy port khác 3000/5173
            const clientURL = "http://localhost:5173"; 
            
            res.redirect(`${clientURL}/index.html?token=${loginToken}`);

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await Users.findOne({ email });
            if (!user) return res.status(400).json({ err: "Email này không tồn tại trong hệ thống." });

            // Tạo token ngẫu nhiên (không dùng JWT để đơn giản hóa việc lưu DB)
            const resetToken = crypto.randomBytes(32).toString("hex");
            
            // Lưu token và thời hạn (1 giờ) vào DB
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
            await user.save();

            // Link reset (Frontend URL)
            // Lưu ý: Port 5173 là port mặc định của Vite dev server, sửa lại nếu cần
            const resetLink = `http://localhost:5173/src/pages/reset-password.html?token=${resetToken}`;

            // Cấu hình gửi mail (Sử dụng lại transporter cũ hoặc tạo mới nếu cần)
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transporter.sendMail({
                from: `"Maneasily Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Yêu cầu đặt lại mật khẩu Maneasily",
                html: `
                    <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu.</p>
                    <p>Vui lòng nhấp vào link sau để đặt lại mật khẩu:</p>
                    <a href="${resetLink}" target="_blank">${resetLink}</a>
                    <p>Link này sẽ hết hạn sau 1 giờ.</p>
                `,
            });

            res.json({ msg: "Email đặt lại mật khẩu đã được gửi!" });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    },

    // --- ĐẶT LẠI MẬT KHẨU MỚI ---
    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;

            // Tìm user có token trùng khớp và chưa hết hạn
            const user = await Users.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }, // Hạn phải lớn hơn thời gian hiện tại
            });

            if (!user) return res.status(400).json({ err: "Token không hợp lệ hoặc đã hết hạn." });

            if (newPassword.length < 6) 
                return res.status(400).json({ err: "Mật khẩu phải có ít nhất 6 ký tự." });

            // Mã hóa mật khẩu mới
            const passwordHash = await bcrypt.hash(newPassword, 12);

            user.password = passwordHash;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({ msg: "Mật khẩu đã được thay đổi thành công! Hãy đăng nhập lại." });

        } catch (err) {
            return res.status(500).json({ err: err.message });
        }
    }
};

export default authCtrl;