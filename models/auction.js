import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  auctionId: { type: String, required: true },

  // description: String,
  // category: String,
  lots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lot" }],
  documents: [{ type: String }], // file paths or URLs
  invitedSuppliers: [{
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        // Allow ObjectId (existing users) or email string (non-existing suppliers)
        return mongoose.Types.ObjectId.isValid(v) || 
               (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      },
      message: 'Invited supplier must be either a valid ObjectId or email address'
    }
  }],
  reservePrice: { type: Number, required: true },
  currency: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  autoExtension: { type: Boolean, default: false },
  // extensionMinutes: { type: Number, default: 5 },
  status: { type: String, enum: ["Scheduled", "Active", "Paused", "Ended"], default: "Scheduled" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // costParams: {
  //   priceWeight: { type: Number, default: 1 },
  //   fobWeight: { type: Number, default: 0 },
  //   taxWeight: { type: Number, default: 0 },
  //   dutyWeight: { type: Number, default: 0 },
  //   performanceWeight: { type: Number, default: 0 },
  //   qualityRequirements: String,
  // },
}, { timestamps: true });

export default mongoose.model("Auction", auctionSchema);