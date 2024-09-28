import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerCustomer, loginCustomer, getUserInfo, getUserId, editProfile, deleteAccount, changePassword, updateAvatarUrl, getAvatarUrl } from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/login", loginCustomer);
router.get("/auth/profile", authMiddleware([UserRole.CUSTOMER]), getUserInfo);
router.put("/auth/profile/edit", authMiddleware([UserRole.CUSTOMER]), editProfile);
router.delete("/auth/profile/delete", authMiddleware([UserRole.CUSTOMER]), deleteAccount);
router.post("/auth/change-password", authMiddleware([UserRole.CUSTOMER]), changePassword);
router.put('/auth/avatar', authMiddleware([UserRole.CUSTOMER]), updateAvatarUrl);
router.get('/auth/getAvatarUrl', authMiddleware([UserRole.CUSTOMER]), getAvatarUrl);
router.get("/auth/getUserId", authMiddleware([UserRole.CUSTOMER]), getUserId);
export { router as customerAccountRouter };