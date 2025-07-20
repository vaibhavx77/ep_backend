import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true },
  lot: { type: mongoose.Schema.Types.ObjectId, ref: "Lot" },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  fob: { type: Number, required: true },
  carton: { type: Number, required: true },
  tax: { type: Number, required: true },
  duty: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  performanceScore: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Withdrawn"], default: "Active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Bid", bidSchema);