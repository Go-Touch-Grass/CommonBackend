import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerCustomer, loginCustomer, getUserInfo, editProfile, deleteAccount, changePassword } from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser';
import { updateCustomerAvatar } from "../controllers/customer_account";

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/login", loginCustomer);
router.get("/auth/profile", authMiddleware([UserRole.CUSTOMER]), getUserInfo);
router.put("/auth/profile/edit", authMiddleware([UserRole.CUSTOMER]), editProfile);
router.delete("/auth/profile/delete", authMiddleware([UserRole.CUSTOMER]), deleteAccount);
router.post("/auth/change-password", authMiddleware([UserRole.CUSTOMER]), changePassword);
// router.post("/auth/update-avatar", authMiddleware([UserRole.CUSTOMER]), updateCustomerAvatar);

export { router as customerAccountRouter };