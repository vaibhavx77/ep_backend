import Bid from "../models/bid.js";
import Auction from "../models/auction.js";

// Submit a new bid
export const submitBid = async (req, res) => {
  try {
    const { auctionId, lotId, amount, currency, fobCost, tax, duty, performanceScore } = req.body;

    // Check if auction exists and supplier is invited
    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });
    if (!auction.invitedSuppliers.includes(req.user.userId)) {
      return res.status(403).json({ message: "You are not invited to this auction" });
    }
    if (auction.status !== "Active") {
      return res.status(400).json({ message: "Auction is not active" });
    }

    // Calculate total cost (can be expanded later)
    const totalCost = amount + fobCost + tax + duty;

    // Create bid
    const bid = new Bid({
      auction: auctionId,
      lot: lotId,
      supplier: req.user.userId,
      amount,
      currency,
      fobCost,
      tax,
      duty,
      totalCost,
      performanceScore,
    });

    await bid.save();

    // Emit real-time update to auction room
    const io = req.app.get("io");
    io.to(auctionId).emit("newBid", { bid });

    res.status(201).json({ message: "Bid submitted", bid });
  } catch (err) {
    res.status(500).json({ message: "Bid submission failed", error: err.message });
  }
};

// Update an active bid
export const updateBid = async (req, res) => {
  try {
    const { bidId } = req.params;
    const { amount, currency, fobCost, tax, duty, performanceScore } = req.body;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: "Bid not found" });
    if (!bid.supplier.equals(req.user.userId)) {
      return res.status(403).json({ message: "You can only update your own bids" });
    }
    if (bid.status !== "Active") {
      return res.status(400).json({ message: "Bid is not active" });
    }

    // Update fields
    bid.amount = amount;
    bid.currency = currency;
    bid.fobCost = fobCost;
    bid.tax = tax;
    bid.duty = duty;
    bid.performanceScore = performanceScore;
    bid.totalCost = amount + fobCost + tax + duty;
    bid.updatedAt = Date.now();

    await bid.save();
    res.json({ message: "Bid updated", bid });
  } catch (err) {
    res.status(500).json({ message: "Bid update failed", error: err.message });
  }
};

// Get bid history for a supplier in an auction
export const getBidHistory = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const bids = await Bid.find({
      auction: auctionId,
      supplier: req.user.userId,
    }).sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bid history", error: err.message });
  }
};

export const getAuctionRanking = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    // Get all active bids for this auction
    const bids = await Bid.find({ auction: auctionId, status: "Active" });

    // Calculate weighted score if costParams are set
    const rankedBids = bids.map(bid => {
      let score = 0;
      if (auction.costParams) {
        score += (bid.amount || 0) * (auction.costParams.priceWeight || 1);
        score += (bid.fobCost || 0) * (auction.costParams.fobWeight || 0);
        score += (bid.tax || 0) * (auction.costParams.taxWeight || 0);
        score += (bid.duty || 0) * (auction.costParams.dutyWeight || 0);
        score -= (bid.performanceScore || 0) * (auction.costParams.performanceWeight || 0);
      } else {
        score = bid.totalCost;
      }
      return { ...bid.toObject(), score };
    });

    // Sort by score ascending (lower is better)
    rankedBids.sort((a, b) => a.score - b.score);

    res.json(rankedBids);
  } catch (err) {
    res.status(500).json({ message: "Failed to get ranking", error: err.message });
  }
};