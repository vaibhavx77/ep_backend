import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  used: { type: Boolean, default: false },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Invitation", invitationSchema);