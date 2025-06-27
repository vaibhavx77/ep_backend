import Invitation from "../models/invitation.js";
import User from "../models/user.js";
import crypto from "crypto";
import { sendInvitationEmail } from "../utils/mailer.js"; // You need to implement this utility

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
    const registrationLink = `${process.env.FRONTEND_URL}/register?token=${token}`;
    await sendInvitationEmail(email, registrationLink);

    res.status(201).json({ message: "Invitation sent successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send invitation", error: err.message });
  }
};