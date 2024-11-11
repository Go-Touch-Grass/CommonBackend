import express from "express";
import { authMiddleware } from "../middleware/auth";
import { UserRole } from "../entities/abstract/abstractUser.entity";
import { getMostPopularVoucher } from "../controllers/businessAnalytics.controller";

const router = express.Router();

router.get("/api/business-analytics/most-popular-voucher", authMiddleware([UserRole.BUSINESS]), getMostPopularVoucher);

export { router as businessAnalyticsRouter };