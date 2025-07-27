import Invitation from "../models/invitation.js";
import User from "../models/user.js";
import crypto from "crypto";
import { sendInvitationEmail, sendAuctionLinkEmail } from "../utils/mailer.js"; // You need to implement this utility
import Auction from "../models/auction.js";

export const inviteSupplier = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists." });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Create invitation
    const invitation = new Invitation({
      email,
      token,
      invitedBy: req.user.userId,
    });
    await invitation.save();

    // Send invitation email (implement sendInvitationEmail)
    const registrationLink = `${process.env.FRONTEND_URL}/supplier/check-email?token=${token}`;
    await sendInvitationEmail(email, registrationLink);

    res.status(201).json({ message: "Invitation sent successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send invitation", error: err.message });
  }
};

export const respondToInvitation = async (req, res) => {
  try {
    const method = req.method;
    let token, response, auctionId;
    if (method === 'POST') {
      token = req.body.token;
      response = req.body.response;
      auctionId = req.body.auctionId;
    } else {
      token = req.query.token;
      response = req.query.response;
      auctionId = req.query.auctionId;
    }
    if (!token || !response || !auctionId) {
      return res.status(400).send("Missing required parameters.");
    }
    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return res.status(404).send("Invalid or expired invitation token.");
    }
    if (invitation.response !== "pending") {
      return res.status(400).send("You have already responded to this invitation.");
    }
    invitation.response = response;
    await invitation.save();
    if (response === "yes") {
      // Send auction link email
      const auction = await Auction.findById(auctionId);
      if (!auction) {
        return res.status(404).send("Auction not found.");
      }
      const auctionLink = `https://epauction.vercel.app/supplier/check-email`;
      await sendAuctionLinkEmail(invitation.email, auction.title, auctionLink);
      return res.send(`
        <html>
          <head>
            <title>Invitation Accepted</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f7f7f7; color: #222; }
              .container { max-width: 500px; margin: 80px auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 40px 30px; text-align: center; }
              h2 { color: #1AAB74; }
              p { font-size: 18px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Invitation Accepted</h2>
              <p>You have accepted the invite and will receive the auction mail shortly.</p>
            </div>
          </body>
        </html>
      `);
    } else {
      return res.send("Thank you for your response.");
    }
  } catch (err) {
    return res.status(500).send("Failed to process invitation response: " + err.message);
  }
};