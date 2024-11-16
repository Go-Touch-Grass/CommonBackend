import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
    registerCustomer,
    loginCustomer,
    getUserInfo,
    editProfile,
    deleteAccount,
    changePassword,
    verifyTopUpCustomer,
    verifyOTP,
    resendOTP,
    getAllValidSubscription,
    updateCustomerAvatar,
    startGroupPurchase,
    joinGroupPurchase,
    getGroupPurchaseStatus,
    cancelGroupPurchaseStatus,
    getAllVouchersForCustomers,
    getAllCreatedGroups,
    getAllJoinedGroups,
    updateCustomerXP,
    repairStreak,
    customerCashback,
    getCustomerTransactions
} from "../controllers/customerAccount.controller";
import { UserRole } from '../entities/abstract/abstractUser.entity';

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

router.get('/auth/vouchers/getAllVouchers', authMiddleware([UserRole.CUSTOMER]), getAllVouchersForCustomers);
router.post('/auth/group-purchase/start', authMiddleware([UserRole.CUSTOMER]), startGroupPurchase);
router.post('/auth/group-purchase/join', authMiddleware([UserRole.CUSTOMER]), joinGroupPurchase);
router.get('/auth/group-purchase/status/:group_purchase_id', authMiddleware([UserRole.CUSTOMER]), getGroupPurchaseStatus);
router.post('/auth/group-purchase/cancel', authMiddleware([UserRole.CUSTOMER]), cancelGroupPurchaseStatus);
router.get('/auth/group-purchase/getAllCreatedGroups', authMiddleware([UserRole.CUSTOMER]), getAllCreatedGroups);
router.get('/auth/group-purchase/getAllJoinedGroups', authMiddleware([UserRole.CUSTOMER]), getAllJoinedGroups);


router.post('/auth/verify-topUp', authMiddleware([UserRole.CUSTOMER]), verifyTopUpCustomer);

router.get('/auth/subscription', authMiddleware([UserRole.CUSTOMER]), getAllValidSubscription);

router.post("/auth/update-xp", authMiddleware([UserRole.CUSTOMER]), updateCustomerXP);

router.post("/auth/customers/:customerId/repair-streak", authMiddleware([UserRole.CUSTOMER]), repairStreak);

router.post("/auth/customers/customercashback", authMiddleware([UserRole.CUSTOMER]), customerCashback);

router.get("/auth/customer-transactions", authMiddleware([UserRole.CUSTOMER]), getCustomerTransactions);

export { router as customerAccountRouter };
