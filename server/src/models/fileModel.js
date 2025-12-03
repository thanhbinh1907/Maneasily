import mongoose from "mongoose";

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    task: { type: mongoose.Types.ObjectId, ref: "tasks", required: true }, // Thuộc task nào
    parent: { type: mongoose.Types.ObjectId, ref: "folders", default: null }, // Folder cha (null là thư mục gốc của Task)
    creator: { type: mongoose.Types.ObjectId, ref: "users" }
}, { timestamps: true });

const fileSchema = new mongoose.Schema({
    originalName: { type: String, required: true }, // Tên gốc (vd: tailieu.pdf)
    filename: { type: String, required: true }, // Tên lưu trên ổ đĩa (vd: 1732...-tailieu.pdf)
    path: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
    task: { type: mongoose.Types.ObjectId, ref: "tasks", required: true },
    folder: { type: mongoose.Types.ObjectId, ref: "folders", default: null }, // Nằm trong folder nào (null là gốc)
    uploader: { type: mongoose.Types.ObjectId, ref: "users" }
}, { timestamps: true });

export const Folders = mongoose.model("folders", folderSchema);
export const Files = mongoose.model("files", fileSchema);