import express from "express";
import { authMiddleware } from "../middleware/auth";
import { UserRole } from "../entities/abstract/abstractUser.entity";
import {
  getAvatarEngagements,
  getGemUtilization,
  getMostPopularVoucher,
  getTotalSales,
  getTransactionCounts,
  getVoucherRedemptionRate,
} from "../controllers/businessAnalytics.controller";

const router = express.Router();

router.get('/api/business-analytics/most-popular-voucher', authMiddleware([UserRole.BUSINESS]), getMostPopularVoucher);
router.get('/api/business-analytics/voucher-redemption-rate', authMiddleware([UserRole.BUSINESS]), getVoucherRedemptionRate);
router.get('/api/business-analytics/total-sales', authMiddleware([UserRole.BUSINESS]), getTotalSales);
router.get('/api/business-analytics/gem-utilization', authMiddleware([UserRole.BUSINESS]), getGemUtilization);
router.get('/api/business-analytics/transaction-counts', authMiddleware([UserRole.BUSINESS]), getTransactionCounts);
router.get('/api/business-analytics/avatar-engagements', authMiddleware([UserRole.BUSINESS]), getAvatarEngagements);

export { router as businessAnalyticsRouter };