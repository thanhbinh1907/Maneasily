import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true, 
        },
        username: {
            type: String,
            required: true,
            unique: true,
            maxlength: 25,
            minlength: 6,
            trim: true,
        },
        password: {
            type: String,
            required: false, 
            minlength: 6,
        },
        avatar: {
            type: String,
            default: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
        },
        projects: [
            {
                type: mongoose.Types.ObjectId,
                ref: "projects",
                default: [],
            },
        ],

        // --- CÁC TRƯỜNG BỔ SUNG ---
        googleId: { type: String },
        githubId: { type: String },
        
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
        },

        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },   
    },
    {
        timestamps: true,
    }
);

// --- TỐI ƯU HÓA DATABASE (Chiến lược Prefix Search) ---
// Tạo 2 Index riêng biệt. MongoDB sẽ sử dụng kỹ thuật "Index Intersection" khi query $or
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export default mongoose.model("users", userSchema);