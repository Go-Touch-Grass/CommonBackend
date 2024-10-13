import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
    registerCustomer,
    loginCustomer,
    getUserInfo,
    editProfile,
    deleteAccount,
    changePassword,
    topUpGemsCustomer,
    verifyOTP,
    resendOTP,
    getVoucherInventory,
    purchaseVoucher,
    redeemVoucherTransaction,
} from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser';
import { updateCustomerAvatar } from "../controllers/customer_account";

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/verifyOTP", verifyOTP);
router.post("/auth/resendOTP", resendOTP);

router.post("/auth/login", loginCustomer);
router.get("/auth/profile", authMiddleware([UserRole.CUSTOMER]), getUserInfo);
router.put("/auth/profile/edit", authMiddleware([UserRole.CUSTOMER]), editProfile);
router.delete("/auth/profile/delete", authMiddleware([UserRole.CUSTOMER]), deleteAccount);
router.post("/auth/change-password", authMiddleware([UserRole.CUSTOMER]), changePassword);
router.post("/auth/update-avatar", authMiddleware([UserRole.CUSTOMER]), updateCustomerAvatar);

router.post('/auth/top_up_gems', authMiddleware([UserRole.CUSTOMER]), topUpGemsCustomer);
router.get('/auth/view_voucher_inventory', authMiddleware([UserRole.CUSTOMER]), getVoucherInventory);
router.post("/auth/vouchers", authMiddleware([UserRole.CUSTOMER]), purchaseVoucher);
router.put('/auth/voucher/redeem/:transactionId', redeemVoucherTransaction);
export { router as customerAccountRouter };
