import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Admin", "Manager", "Viewer", "Supplier"],
    default: "Supplier",
  },
  isVerified: { type: Boolean, default: false },
  profile: {
    companyName: { type: String, required: function() { return this.role === "Supplier"; } },
    registrationNumber: { type: String, required: function() { return this.role === "Supplier"; } },
    taxId: { type: String, required: function() { return this.role === "Supplier"; } },
    address: { type: String, required: function() { return this.role === "Supplier"; } },
    coreCapabilities: { type: String, required: function() { return this.role === "Supplier"; } },
    portOfLoading: { type: String, required: function() { return this.role === "Supplier"; } },
    containerCapacity: { type: Number, required: function() { return this.role === "Supplier"; } },
    importDutiesInfo: { type: String, required: function() { return this.role === "Supplier"; } },
    // ...add more as needed...
  },
  businessDocs: [{
    type: String, // file path or URL
    required: function() { return this.role === "Supplier"; }
  }],
  createdAt: { type: Date, default: Date.now },
  otpCode: { type: String },
  otpExpires: { type: Date },
  agreedToTerms: { type: Boolean, required: function() { return this.role === "Supplier"; } },
});

export default mongoose.model("User", userSchema);