import express from "express";
import { getProfile, getUserByEmail, updateProfile } from "../controllers/userController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/by-email", getUserByEmail);

export default router;