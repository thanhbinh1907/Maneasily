// File: Maneasily/server/src/middleware/auth.js
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        
        // --- [DEBUG LOG] Thêm dòng này để kiểm tra ---
        console.log("👉 Auth Middleware - URL:", req.originalUrl);
        console.log("👉 Received Token:", token ? token.substring(0, 15) + "..." : "NULL/EMPTY");
        // ---------------------------------------------

        if (!token) return res.status(401).json({ err: "Vui lòng đăng nhập (Token missing)." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return res.status(401).json({ err: "Xác thực không hợp lệ." });

        req.user = decoded;
        next();
    } catch (err) {
        console.log("❌ Auth Error:", err.message); // Log lỗi cụ thể
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ err: "Phiên đăng nhập hết hạn. Hãy đăng nhập lại." });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ err: "Token không hợp lệ." });
        }
        return res.status(500).json({ err: err.message });
    }
};

export default auth;