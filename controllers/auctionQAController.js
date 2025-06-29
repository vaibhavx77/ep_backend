import Auction from "../models/auction.js";
import Lot from "../models/lot.js";
import User from "../models/user.js";
import Bid from "../models/bid.js";
import Invitation from "../models/invitation.js";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendInvitationEmail } from "../utils/mailer.js";
import { getAgendaInstance } from '../agenda.js'
import { isSupplierInvitedToAuction } from "../utils/auctionUtils.js";

// Create Auction (with optional lots)
export const createAuction = async (req, res) => {
  try {
    console.log('Auction payload:', req.body); // <-- Add this line

    const {
      title,
      description,
      category,
      reservePrice,
      currency,
      startTime,
      endTime,
      autoExtension,
      extensionMinutes,
      invitedSuppliers,
      costParams,
      lots // Array of lot objects
    } = req.body;

    // Handle auction-level documents
    const documents = req.files?.auctionDocs?.map(file => file.path) || [];

    // Process invited suppliers - separate existing users and email addresses
    let processedInvitedSuppliers = [];
    let newInvitations = [];

    if (invitedSuppliers && invitedSuppliers.length > 0) {
      for (const supplier of invitedSuppliers) {
        // Check if it's an ObjectId (existing user)
        if (mongoose.Types.ObjectId.isValid(supplier)) {
          // Validate that the user exists and is a supplier
          const existingUser = await User.findOne({
            _id: supplier,
            role: "Supplier"
          });
          if (existingUser) {
            processedInvitedSuppliers.push(supplier);
          } else {
            return res.status(400).json({ 
              message: `User with ID ${supplier} is not a valid supplier.` 
            });
          }
        } else if (typeof supplier === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier)) {
          // It's an email address - check if user already exists
          const existingUser = await User.findOne({ email: supplier });
          if (existingUser) {
            if (existingUser.role === "Supplier") {
              processedInvitedSuppliers.push(existingUser._id);
            } else {
              return res.status(400).json({ 
                message: `User with email ${supplier} is not a supplier.` 
              });
            }
          } else {
            // Create invitation for new supplier
            const token = crypto.randomBytes(32).toString("hex");
            const invitation = new Invitation({
              email: supplier,
              token,
              invitedBy: req.user.userId,
            });
            await invitation.save();
            newInvitations.push({ email: supplier, invitation });
            
            // Add email to invited suppliers (will be converted to user ID when they register)
            processedInvitedSuppliers.push(supplier);
          }
        } else {
          return res.status(400).json({ 
            message: `Invalid supplier format: ${supplier}. Must be a valid ObjectId or email address.` 
          });
        }
      }
    }

    // Create auction
    const auction = new Auction({
      title,
      description,
      category,
      reservePrice,
      currency,
      startTime,
      endTime,
      autoExtension,
      extensionMinutes,
      invitedSuppliers: processedInvitedSuppliers,
      costParams,
      documents,
      createdBy: req.user.userId,
    });

    await auction.save();

    const agenda = getAgendaInstance();

// Schedule start job
await agenda.schedule(new Date(startTime), 'start auction', { auctionId: auction._id });

// Schedule end job
await agenda.schedule(new Date(endTime), 'end auction', { auctionId: auction._id });

    // Send invitation emails for new suppliers
    for (const { email, invitation } of newInvitations) {
      try {
        const registrationLink = `${process.env.FRONTEND_URL}/register?token=${invitation.token}&auctionId=${auction._id}`;
        await sendInvitationEmail(email, registrationLink, auction.title);
      } catch (emailError) {
        console.error(`Failed to send invitation email to ${email}:`, emailError);
        // Continue with other invitations even if one fails
      }
    }

    // Handle lots (if any)
    if (lots && lots.length > 0) {
      for (let i = 0; i < lots.length; i++) {
        const lot = lots[i];
        const lotDocs = req.files?.[`lotDocs${i}`]?.map(file => file.path) || [];
        const newLot = new Lot({
          auction: auction._id,
          name: lot.name,
          description: lot.description,
          specifications: lot.specifications,
          documents: lotDocs,
          reservePrice: lot.reservePrice,
          currency: lot.currency,
        });
        await newLot.save();
        auction.lots.push(newLot._id);
      }
      await auction.save();
    }

    res.status(201).json({ 
      message: "Auction created successfully", 
      auction,
      invitationsSent: newInvitations.length
    });
  } catch (err) {
    console.error(err); // <-- Also add this for error details
    res.status(500).json({ message: "Auction creation failed", error: err.message });
  }
};

// List all auctions (EP members: all, Suppliers: only invited & active)
export const listAuctions = async (req, res) => {
  try {
    console.log(req.user.userId, "req.user.userId")
    let auctions;
    if (["Admin", "Manager", "Viewer"].includes(req.user.role)) {
      auctions = await Auction.find().populate("lots invitedSuppliers createdBy");
    } else if (req.user.role === "Supplier") {
      // For suppliers, check if they are invited either by ID or email
      const user = await User.findById(req.user.userId);
      auctions = await Auction.find({
        $or: [
          { invitedSuppliers: req.user.userId }, // Check by ObjectId
          { invitedSuppliers: user.email } // Check by email
        ],
        status: { $in: ["Active", "Scheduled"] }
      }).populate("lots invitedSuppliers createdBy");
    } else{
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch auctions", error: err.message });
  }
};

// Get auction details by ID
export const getAuctionDetails = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate("lots invitedSuppliers createdBy");
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    // Suppliers can only view auctions they're invited to
    if (req.user.role === "Supplier") {
      const user = await User.findById(req.user.userId);
      const isInvited = await isSupplierInvitedToAuction(auction._id, user.email) || 
                        await isSupplierInvitedToAuction(auction._id, req.user.userId);
      
      if (!isInvited) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch auction details", error: err.message });
  }
};

// Pause auction
export const pauseAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.status !== "Active") {
      return res.status(400).json({ message: "Only active auctions can be paused." });
    }

    auction.status = "Paused";
    await auction.save();

    // (Optional) Emit real-time update
    if (req.app.get("io")) {
      req.app.get("io").to(auction._id.toString()).emit("auctionStatusChanged", { status: "Paused" });
    }

    res.json({ message: "Auction paused", auction });
  } catch (err) {
    res.status(500).json({ message: "Failed to pause auction", error: err.message });
  }
};

// Resume auction
export const resumeAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    if (auction.status !== "Paused") {
      return res.status(400).json({ message: "Only paused auctions can be resumed." });
    }

    auction.status = "Active";
    await auction.save();

    // (Optional) Emit real-time update
    if (req.app.get("io")) {
      req.app.get("io").to(auction._id.toString()).emit("auctionStatusChanged", { status: "Active" });
    }

    res.json({ message: "Auction resumed", auction });
  } catch (err) {
    res.status(500).json({ message: "Failed to resume auction", error: err.message });
  }
};

export const getAuctionMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    const auction = await Auction.findById(id).populate("lots invitedSuppliers");
    if (!auction) return res.status(404).json({ message: "Auction not found" });

    // Get all bids for this auction
    const bids = await Bid.find({ auction: id });

    // Participation: unique suppliers who have placed bids
    const participatingSuppliers = [...new Set(bids.map(b => b.supplier.toString()))];

    // Bid activity timeline
    const bidTimeline = bids.map(b => ({
      supplier: b.supplier,
      amount: b.amount,
      createdAt: b.createdAt
    }));

    res.json({
      auction,
      participationCount: participatingSuppliers.length,
      bidTimeline
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch monitoring data", error: err.message });
  }
};