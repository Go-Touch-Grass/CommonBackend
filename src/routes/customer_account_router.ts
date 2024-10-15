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
    updateCustomerAvatar
} from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser';

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

router.post('/auth/verify-topUp', authMiddleware([UserRole.CUSTOMER]), verifyTopUpCustomer);

router.get('/auth/subscription', authMiddleware([UserRole.CUSTOMER]), getAllValidSubscription);

export { router as customerAccountRouter };
