import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";
import { submitBid, updateBid, getBidHistory, getAuctionRanking } from "../controllers/bidController.js";

const router = express.Router();

// Suppliers submit a new bid
router.post("/", authenticate, authorizeRoles("Supplier"), submitBid);

// Suppliers update their bid
router.put("/:bidId", authenticate, authorizeRoles("Supplier"), updateBid);

// Suppliers get their bid history for an auction
router.get("/history/:auctionId", authenticate, authorizeRoles("Supplier"), getBidHistory);

// Get auction ranking
router.get("/ranking/:auctionId", authenticate, getAuctionRanking);

export default router;