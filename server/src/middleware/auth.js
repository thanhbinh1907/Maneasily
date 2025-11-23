// File: Maneasily/server/src/middleware/auth.js
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        if (!token) return res.status(400).json({ err: "Xác thực không hợp lệ." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return res.status(400).json({ err: "Xác thực không hợp lệ." });

        req.user = decoded; // Gán payload (chứa id) vào req.user
        next();
    } catch (err) {
        return res.status(500).json({ err: err.message });
    }
};

export default auth;