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
        
        // Cài đặt cho trang Hoạt động (Activity) - KHÔNG ĐỔI
        activitySettings: {
            pinnedProjects: [{ type: mongoose.Types.ObjectId, ref: "projects" }], 
            projectOrder: [{ type: mongoose.Types.ObjectId, ref: "projects" }]    
        },

        // [MỚI] Cài đặt riêng cho trang Dự án (Project List)
        projectSettings: {
            pinnedProjects: [{ type: mongoose.Types.ObjectId, ref: "projects" }]
        },
        settings: {
            theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
            language: { type: String, default: 'vi' },
            notifications: {
                emailOnInvite: { type: Boolean, default: true },
                deadlineReminder: {
                    enabled: { type: Boolean, default: true }, 
                    daysBefore: { type: Number, default: 1 },  
                    hoursBefore: { type: Number, default: 2 } 
                },
                soundEnabled: { type: Boolean, default: true }
            },
            privacy: {
                searchable: { type: Boolean, default: true },      
                requireInvite: { type: Boolean, default: false }
            }
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("users", userSchema);