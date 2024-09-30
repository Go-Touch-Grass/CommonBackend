import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerCustomer, loginCustomer, getUserInfo, editProfile, deleteAccount, changePassword, createAvatar, updateAvatar, getAvatarDetails } from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/login", loginCustomer);
router.get("/auth/profile", authMiddleware([UserRole.CUSTOMER]), getUserInfo);
router.put("/auth/profile/edit", authMiddleware([UserRole.CUSTOMER]), editProfile);
router.delete("/auth/profile/delete", authMiddleware([UserRole.CUSTOMER]), deleteAccount);
router.post("/auth/change-password", authMiddleware([UserRole.CUSTOMER]), changePassword);
router.post('/auth/avatar', authMiddleware([UserRole.CUSTOMER]), createAvatar);
router.put('/auth/avatar/update', authMiddleware([UserRole.CUSTOMER]), updateAvatar);
router.get('/auth/avatar', authMiddleware([UserRole.CUSTOMER]), getAvatarDetails);

export { router as customerAccountRouter };