import mongoose from "mongoose";

const lotSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true },
  name: { type: String, required: true },
  description: String,
  specifications: String,
  documents: [{ type: String }], // file paths or URLs
  reservePrice: { type: Number, required: true },
  currency: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Lot", lotSchema);