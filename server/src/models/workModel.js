import mongoose from "mongoose";

const workSchema = new mongoose.Schema({
    title: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    task: { type: mongoose.Types.ObjectId, ref: "tasks" },
    members: [{ type: mongoose.Types.ObjectId, ref: "users" }]
}, { timestamps: true });

export default mongoose.model("works", workSchema);