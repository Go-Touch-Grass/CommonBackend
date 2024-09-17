import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerCustomer, loginCustomer, getUserInfo } from "../controllers/customer_account";
import { UserRole } from '../entities/abstract/AbstractUser'; // Make sure to import UserRole

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/login", loginCustomer);
router.get("/auth/user", authMiddleware([UserRole.CUSTOMER]), getUserInfo);

export { router as customerAccountRouter };