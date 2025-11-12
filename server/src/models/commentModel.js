import mongoose from "mongoose";
const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        task: {
            type: mongoose.Types.ObjectId,
            ref: "tasks",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("comments", commentSchema);