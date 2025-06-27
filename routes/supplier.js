import express from "express";
import { getProfile, updateProfile } from "../controllers/supplierController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import upload from "../utils/multerConfig.js";

const router = express.Router();

// Only authenticated suppliers can access these routes
router.get("/profile", authenticate, authorizeRoles("Supplier"), getProfile);
router.put("/profile", authenticate, authorizeRoles("Supplier"), updateProfile);

// Upload business verification document
router.post(
  "/upload-doc",
  authenticate,
  authorizeRoles("Supplier"),
  upload.single("document"),
  async (req, res) => {
    try {
      // Save file path to user's businessDocs array
      const user = await import("../models/user.js").then(m => m.default.findByIdAndUpdate(
        req.user.userId,
        { $push: { businessDocs: req.file.path } },
        { new: true }
      ));
      res.json({ message: "Document uploaded", file: req.file.path });
    } catch (err) {
      res.status(500).json({ message: "Upload failed", error: err.message });
    }
  }
);

export default router;