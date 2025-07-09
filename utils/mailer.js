import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  });
};

export const inviteAuction = async (to, auction) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Auction Invite",
    text: `Your are invited to an auction ${auction?.title}`,
  });
};

export const sendInvitationEmail = async (to, registrationLink, auctionTitle = "an auction") => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `You've been invited to participate in ${auctionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Auction Invitation</h2>
        <p>You have been invited to participate in <strong>${auctionTitle}</strong>.</p>
        <p>To register and participate in this auction, please click the link below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationLink}" 
             style="background-color: #1AAB74; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Register & Join Auction
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${registrationLink}">${registrationLink}</a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This invitation link is unique to you and will expire once used.
        </p>
      </div>
    `,
  });
};