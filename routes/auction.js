import express from "express";
import {
  createAuction,
  listAuctions,
  getAuctionDetails,
  pauseAuction,
  resumeAuction,
  getAuctionMonitoring,
} from "../controllers/auctionController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import upload from "../utils/multerConfig.js";

const router = express.Router();

// Admin/Manager/Viewer can create auctions
router.post(
  "/create",
  authenticate,
  authorizeRoles("Admin", "Manager", "Viewer"),
  upload.fields([
    { name: "auctionDocs", maxCount: 5 },
    { name: "lotDocs0", maxCount: 5 },
    { name: "lotDocs1", maxCount: 5 },
    // Add more lotDocs fields as needed for lots
  ]),
  createAuction
);

// List auctions
router.get("/", authenticate, listAuctions);

// Get auction details
router.get("/:id", authenticate, getAuctionDetails);

// Pause auction
router.post(
  "/:id/pause",
  authenticate,
  authorizeRoles("Admin", "Manager", "Viewer"),
  pauseAuction
);

// Resume auction
router.post(
  "/:id/resume",
  authenticate,
  authorizeRoles("Admin", "Manager", "Viewer"),
  resumeAuction
);

// Get auction monitoring
router.get(
  "/:id/monitoring",
  authenticate,
  authorizeRoles("Admin", "Manager", "Viewer"),
  getAuctionMonitoring
);

export default router;