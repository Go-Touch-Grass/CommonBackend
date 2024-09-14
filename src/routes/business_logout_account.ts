import express from "express";
import { authMiddleware } from "../middleware/auth";
import { logoutAccount } from "../controllers/business_logout_account";

const router = express.Router();

router.post("/api/business/logout", logoutAccount);

export { router as businessLogoutAccountRouter };