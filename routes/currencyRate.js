import express from "express";
import { addCurrencyRate, deleteCurrencyRate, getAllCurrencyRates, getCurrencyRateByCode } from "../controllers/currencyRateController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();
router.post("/", addCurrencyRate);

// router.post("/", authorizeRoles("Admin", "Manager", "Viewer"), addCurrencyRate);
router.get("/", getAllCurrencyRates);
router.get("/:code", getCurrencyRateByCode);
router.delete('/', deleteCurrencyRate);


export default router;