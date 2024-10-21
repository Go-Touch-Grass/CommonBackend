import express from "express";
import { authMiddleware } from "../middleware/auth";
import { UserRole } from '../entities/abstract/AbstractUser';
import {
    getVoucherInventory,
    purchaseVoucher,
    redeemVoucher,
    addItemToCustomerInventory,
    getCustomerItems,
    updateVoucherStatus
} from "../controllers/customer_inventory";

const router = express.Router();

// Routes that require authentication
router.get("/api/inventory/vouchers", authMiddleware([UserRole.CUSTOMER]), getVoucherInventory);
router.post("/api/inventory/vouchers/purchase", authMiddleware([UserRole.CUSTOMER]), purchaseVoucher);
router.put("/api/inventory/vouchers/redeem/:transactionId", authMiddleware([UserRole.CUSTOMER]), redeemVoucher);
router.post("/api/inventory/items/add", authMiddleware([UserRole.CUSTOMER]), addItemToCustomerInventory);
router.get("/api/inventory/items", authMiddleware([UserRole.CUSTOMER]), getCustomerItems);
router.put("/api/inventory/vouchers/status", authMiddleware([UserRole.CUSTOMER]), updateVoucherStatus);

export { router as customerInventoryRouter };
