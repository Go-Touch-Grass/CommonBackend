import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createChatCompletion } from "../controllers/chat.controller";
import { UserRole } from '../entities/abstract/abstractUser.entity';

const router = express.Router();

router.post("/api/chat", authMiddleware([UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER]), createChatCompletion);

export { router as chatRouter };
