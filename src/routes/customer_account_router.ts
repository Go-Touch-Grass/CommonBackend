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
    startGroupPurchase,
    joinGroupPurchase,
    getGroupPurchaseStatus,
    cancelGroupPurchaseStatus,
    getAllVouchersForCustomers,
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

router.get('/auth/vouchers/getAllVouchers', authMiddleware([UserRole.CUSTOMER]), getAllVouchersForCustomers);
router.post('/auth/group-purchase/start', authMiddleware([UserRole.CUSTOMER]), startGroupPurchase);
router.post('/auth/group-purchase/join', authMiddleware([UserRole.CUSTOMER]), joinGroupPurchase);
router.get('/auth/group-purchase/status/:group_purchase_id', authMiddleware([UserRole.CUSTOMER]), getGroupPurchaseStatus);
router.post('/auth/group-purchase/cancel', authMiddleware([UserRole.CUSTOMER]), cancelGroupPurchaseStatus);


export { router as customerAccountRouter };
