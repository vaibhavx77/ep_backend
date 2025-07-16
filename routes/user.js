import express from "express";
import { getProfile, updateProfile, checkEmail } from "../controllers/userController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/check-email", checkEmail);

export default router;