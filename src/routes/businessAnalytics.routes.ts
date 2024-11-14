import express from "express";
import { authMiddleware } from "../middleware/auth";
import { UserRole } from "../entities/abstract/abstractUser.entity";
import {
  getMostPopularVoucher,
  getTotalSales,
  getVoucherRedemptionRate,
} from "../controllers/businessAnalytics.controller";

const router = express.Router();

router.get('/api/business-analytics/most-popular-voucher', authMiddleware([UserRole.BUSINESS]), getMostPopularVoucher);
router.get('/api/business-analytics/voucher-redemption-rate', authMiddleware([UserRole.BUSINESS]), getVoucherRedemptionRate);
router.get('/api/business-analytics/total-sales', authMiddleware([UserRole.BUSINESS]), getTotalSales);

export { router as businessAnalyticsRouter };