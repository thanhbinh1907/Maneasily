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
        
        isPrivate: {
            type: Boolean,
            default: false
        },
        
        activitySettings: {
            pinnedProjects: [{ type: mongoose.Types.ObjectId, ref: "projects" }], // Danh sách ID dự án đã ghim
            projectOrder: [{ type: mongoose.Types.ObjectId, ref: "projects" }]    // Thứ tự sắp xếp
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("users", userSchema);