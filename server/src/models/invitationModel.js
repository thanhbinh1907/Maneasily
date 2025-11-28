import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
    sender: { type: mongoose.Types.ObjectId, ref: "users", required: true },
    recipient: { type: mongoose.Types.ObjectId, ref: "users", required: true },
    project: { type: mongoose.Types.ObjectId, ref: "projects", required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model("invitations", invitationSchema);