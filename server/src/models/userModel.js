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
            default:
                "https://scontent.fhan2-4.fna.fbcdn.net/v/t39.30808-6/273843600_3181275192141119_4501962545142513337_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=1uZto8_7u7UAX_lmdit&_nc_ht=scontent.fhan2-4.fna&oh=00_AT9mmIWzzmOpOfkZqX8zvi8SmoB7CiuZyiJCe5qqC3Jesg&oe=6300C76A",
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