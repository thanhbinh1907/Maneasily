import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Users from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`, 
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 1. Kiểm tra xem user đã từng đăng nhập bằng Google chưa?
                let user = await Users.findOne({ googleId: profile.id });
                if (user) {
                    return done(null, user);
                }

                // 2. Nếu chưa, kiểm tra xem Email này đã có trong DB chưa?
                const email = profile.emails[0].value;
                user = await Users.findOne({ email: email });

                if (user) {
                    // Đã có email (đăng ký thường), giờ liên kết thêm Google ID vào
                    user.googleId = profile.id;
                    user.isVerified = true; // Google đã xác thực email rồi
                    // Cập nhật avatar nếu chưa có
                    if (!user.avatar || user.avatar.includes("default")) {
                        user.avatar = profile.photos[0].value;
                    }
                    await user.save();
                    return done(null, user);
                }

                // 3. User mới hoàn toàn -> Tạo mới
                const newUser = new Users({
                    googleId: profile.id,
                    email: email,
                    // Tạo username từ tên Google (xóa khoảng trắng + số ngẫu nhiên để tránh trùng)
                    username: profile.displayName.replace(/\s/g, "") + Math.floor(Math.random() * 10000),
                    avatar: profile.photos[0].value,
                    isVerified: true, // Mặc định true
                });

                await newUser.save();
                return done(null, newUser);

            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// Passport cần 2 hàm này để quản lý session tạm thời
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await Users.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});