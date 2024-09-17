import express from "express";
import { authMiddleware } from "../middleware/auth";
import { loginAccount } from "../controllers/business_login_account";

const router = express.Router();

router.post("/api/business/login", loginAccount);

export { router as businessLoginAccountRouter };