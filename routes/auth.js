import express from "express";
import { register, login, verifyOtp, createEpMember } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Registration route
router.post("/register", register);

// Login route
router.post("/login", login);

// OTP verification route
router.post("/verify-otp", verifyOtp);

// Admin creates EP member accounts
router.post(
  "/create-ep-member",
  // authenticate,
  // authorizeRoles("Admin"),
  createEpMember
);

export default router;