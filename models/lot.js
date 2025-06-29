import mongoose from "mongoose";

const lotSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true },
  lotId: { type: String, required: true },
  name: { type: String, required: true },
  material: {type: String, required: true},
  prevCost: {type: String, required: true},
  hsCode: {type: String, required: true},
 dimensions: { type: Object } 
  // description: String,
  // specifications: String,
  // documents: [{ type: String }], // file paths or URLs
  // reservePrice: { type: Number, required: true },
  // currency: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Lot", lotSchema);