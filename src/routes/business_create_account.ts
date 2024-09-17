import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createAccount } from "../controllers/business_create_account";

const router = express.Router();

router.post("/api/business/account", createAccount);

export { router as businessCreateAccountRouter };