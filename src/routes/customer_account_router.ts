import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerCustomer, loginCustomer, getUserInfo, editProfile, deleteAccount } from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser'; // Make sure to import UserRole

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/login", loginCustomer);
router.get("/auth/profile", authMiddleware([UserRole.CUSTOMER]), getUserInfo);
router.put("/auth/profile/edit", authMiddleware([UserRole.CUSTOMER]), editProfile);
router.delete("/auth/profile/delete", authMiddleware([UserRole.CUSTOMER]), deleteAccount);

export { router as customerAccountRouter };