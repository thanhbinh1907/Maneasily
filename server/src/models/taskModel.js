import mongoose from "mongoose";
const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        dec: {
            type: String,
            required: true,
        },
        color: {
            type: String,
            required: true,
        },
        tag: {
            type: String,
            required: true,
        },
        startTime: { 
            type: Date, 
        },
        deadline: {
            type: Date,
        },
        reminderHistory: {
            lastDailySent: { type: Date, default: null }, 
            isHourlySent: { type: Boolean, default: false } 
        },
        column: {
            type: mongoose.Types.ObjectId,
            ref: "columns",
        },
        members: [
            {
                type: mongoose.Types.ObjectId,
                ref: "users",
            },
        ],
        project: {
            type: mongoose.Types.ObjectId,
            ref: "projects",
        },
        works: [
            {
                type: mongoose.Types.ObjectId,
                ref: "works",
            },
        ],
        comments: [
            {
                type: mongoose.Types.ObjectId,
                ref: "comments",
            },
        ],
        countWork: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("tasks", taskSchema);