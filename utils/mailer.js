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

// export const inviteAuction = async (to, auction) => {
//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to,
//     subject: "Auction Invite",
//     text: `Your are invited to an auction ${auction?.title}`,
//   });
// };
export const inviteAuction = async (to, auction, previewEmail) => {
  const loginUrl = `https://epauction.vercel.app/supplier/check-email`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Auction Invite",
    text: previewEmail
      ? `${previewEmail}\n\nLogin here: ${loginUrl}`
      : `You are invited to an auction: ${auction?.title}\nPlease log in to participate: ${loginUrl}`,
    html: previewEmail
      ? `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">${previewEmail}<br><br><a href=\"${loginUrl}\">${loginUrl}</a></div>`
      : `<p>You are invited to an auction: <strong>${auction?.title}</strong></p><p>Please <a href=\"${loginUrl}\">click here</a> to log in and join the auction.</p>`,
  });
};

export const sendRegistrationInvite = async (email, previewEmail) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "You're Invited to an Auction",
    html: previewEmail
      ? `<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">${previewEmail}</div>`
      : `You’ve been invited to participate in an auction. Register here: <a href=https://epauction.vercel.app/supplier/check-email>Register</a>`,
  });
};

export const sendInvitationEmail = async (to, registrationLink, auctionTitle = "an auction", customHtmlBody) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `You've been invited to participate in ${auctionTitle}`,
    html: customHtmlBody || `
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

export const sendAuctionConfirmationEmail = async (to, auctionTitle, confirmationLink, previewEmail, token, auctionId) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Confirm Participation in ${auctionTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Auction Participation Confirmation</h2>
        <p>You are invited to participate in <strong>${auctionTitle}</strong>.</p>
        ${previewEmail ? `<div style='background: #f5f5f5; border-radius: 6px; padding: 16px 18px; margin: 18px 0; color: #444;'>${previewEmail}</div>` : ''}
        <p>To confirm your participation, please click the button below:</p>
        <form action="${process.env.BACKEND_URL || 'http://localhost:5001'}/api/invitation/respond" method="POST" style="text-align: center; margin: 30px 0;">
          <input type="hidden" name="token" value="${token}" />
          <input type="hidden" name="response" value="yes" />
          <input type="hidden" name="auctionId" value="${auctionId}" />
          <button type="submit" style="background-color: #1AAB74; color: white; padding: 12px 24px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">Yes, I want to participate</button>
        </form>
      </div>
    `,
  });
};

export const sendAuctionLinkEmail = async (to, auctionTitle, auctionLink, customHtmlBody) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `Auction Link for ${auctionTitle}`,
    html: customHtmlBody || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Auction Link</h2>
        <p>Thank you for confirming your participation in <strong>${auctionTitle}</strong>.</p>
        <p>Click the link below to access the auction:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${auctionLink}"
             style="background-color: #1AAB74; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Auction
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${auctionLink}">${auctionLink}</a>
        </p>
      </div>
    `,
  });
};