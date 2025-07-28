import Bid from "../models/bid.js";
import Auction from "../models/auction.js";

// Submit a new bid
export const submitBid = async (req, res) => {
  try {
    const { auctionId, lotId, amount, currency, fob, carton, tax, duty, performanceScore } = req.body;

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
    const totalCost = amount + fob + tax + duty;

    // Create bid
    const bid = new Bid({
      auction: auctionId,
      lot: lotId,
      supplier: req.user.userId,
      amount,
      currency,
      fob,
      carton,
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
    const { amount, currency, fob, tax, duty, performanceScore } = req.body;

    const bid = await Bid.findById(bidId);
   if (!bid) return res.status(404).json({ message: "Bid not found" });
    if (!bid.supplier.equals(req.user.userId)) {
      return res.status(403).json({ message: "You can only update your own bids" });
    }
    if (bid.status !== "Active") {
      return res.status(400).json({ message: "Bid is not active" });
    }

      const auction = await Auction.findOne({_id: bid.auction});
  if (auction?.autoExtension === true) {
      const allActiveBids = await Bid.find({ auction: bid.auction, status: "Active", _id: { $ne: bidId } });

      const allAmounts = allActiveBids.map(b => b.amount);
      const isHighest = allAmounts.every(existingAmount => amount > existingAmount);

      if (isHighest) {
        // Extend the endTime by 5 minutes
        const extendedTime = new Date(auction.endTime.getTime() + 5 * 60000); // 5 mins in ms
        auction.endTime = extendedTime;
        await auction.save();
      }
    }

    // Update fields
    bid.amount = amount;
    bid.currency = bid.currency;
    bid.fob = fob;
    bid.tax = tax;
    bid.duty = duty;
    bid.performanceScore = performanceScore;
    bid.totalCost = amount + fob + tax + duty;
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

// export const getAuctionRanking = async (req, res) => {
//   try {
//     const { auctionId } = req.params;
//     const auction = await Auction.findById(auctionId);
//     if (!auction) return res.status(404).json({ message: "Auction not found" });

//     let bids;
//     if (req.user.role === "Supplier") {
//       // Only return this supplier's bids
//       bids = await Bid.find({ auction: auctionId, status: "Active", supplier: req.user.userId });
//     } else {
//       // For admin/EP, return all bids
//       bids = await Bid.find({ auction: auctionId, status: "Active" }).populate("lot supplier");
//     }

//     // Calculate weighted score if costParams are set
//     /*
//     const rankedBids = bids.map(bid => {
//       let score = 0;
//       if (auction.costParams) {
//         score += (bid.amount || 0) * (auction.costParams.priceWeight || 1);
//         score += (bid.fob || 0) * (auction.costParams.fobWeight || 0);
//         score += (bid.tax || 0) * (auction.costParams.taxWeight || 0);
//         score += (bid.duty || 0) * (auction.costParams.dutyWeight || 0);
//         score -= (bid.performanceScore || 0) * (auction.costParams.performanceWeight || 0);
//       } else {
//         score = bid.totalCost;
//       }
//       return { ...bid.toObject(), score };
//     });

//     // Sort by score ascending (lower is better)
//     rankedBids.sort((a, b) => a.score - b.score);
//     */
//     // Sort bids by amount (ascending)
//     const sortedBids = bids.sort((a, b) => a.amount - b.amount);

//     // Add rank field
//     const rankedBids = sortedBids.map((bid, idx) => ({
//       ...bid.toObject(),
//       rank: idx + 1
//     }));

//     res.json(rankedBids);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to get auction ranking", error: err.message });
//   }
// };

export const getAuctionRanking = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const auction = await Auction.findById(auctionId);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    let bids;

    // Exchange rates to GBP (you can expand this or move to a config file/service)
    const exchangeRates = {
      INR: 116.7,
      USD: 1.3,
      EUR: 1.15,
      GBP: 1,
      VND: 35364,
      TRY: 54.2,
      CNY: 9.6
    };

    if (req.user.role === "Supplier") {
    const allBids = await Bid.find({ auction: auctionId, status: "Active" });

  // Convert all bids to GBP using (amount + fob)
  const allBidsInGBP = allBids.map(bid => {
    const rate = exchangeRates[bid.currency] || 1;
    const amountGBP = bid.amount / rate;
    const fobGBP = bid.fob / rate;
    const totalForRanking = amountGBP + fobGBP;

    return {
      ...bid.toObject(),
      supplierId: bid.supplier.toString(),
      // amount: parseFloat(amountGBP.toFixed(2)),
      // fob: parseFloat(fobGBP.toFixed(2)),
      // currency: "GBP",
      totalForRanking: parseFloat(totalForRanking.toFixed(2))
    };
  });

  // Sort all bids by totalForRanking
  allBidsInGBP.sort((a, b) => a.totalForRanking - b.totalForRanking);

  // Assign rank to each bid
  const rankedBids = allBidsInGBP.map((bid, idx) => ({
    ...bid,
    rank: idx + 1
  }));

  // Filter out only current supplier's bids
  const supplierBids = rankedBids.filter(bid => bid.supplierId === req.user.userId);
  return res.json(supplierBids);
    } else {
      // For admin/EP, return all bids
      bids = await Bid.find({ auction: auctionId, status: "Active" }).populate("lot supplier");

      // Convert to GBP equivalent
      bids = bids.map(bid => {
        const rate = exchangeRates[bid.currency] || 1; // default to 1 if unknown
        const normalizedAmount = bid.totalCost / rate;
        return {
          ...bid.toObject(),
          fob: parseFloat((bid.fob / rate).toFixed(2)),
         totalCost: parseFloat(normalizedAmount.toFixed(2)),
        };
      });

// ✅ Sort by totalCost (lowest first)
bids.sort((a, b) => a.totalCost - b.totalCost);

// Add rank based on sorted order
const rankedBids = bids.map((bid, idx) => ({
  ...bid,
  rank: idx + 1
}));

      return res.json(rankedBids);
    }

    // // If user is Supplier, sort normally without normalization
    // const sortedBids = bids.sort((a, b) => a.totalCost - b.totalCost);
    // const rankedBids = sortedBids.map((bid, idx) => ({
    //   ...bid.toObject(),
    //   rank: idx + 1
    // }));
    // console.log(rankedBids, "ran>>>>>")
    // res.json(rankedBids);
  } catch (err) {
    res.status(500).json({ message: "Failed to get auction ranking", error: err.message });
  }
};