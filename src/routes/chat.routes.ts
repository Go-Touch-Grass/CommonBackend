import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createChatCompletion, streamChatCompletion } from "../controllers/chat.controller";
import { UserRole } from '../entities/abstract/abstractUser.entity';

const router = express.Router();

router.post("/api/chat", authMiddleware([UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER]), createChatCompletion);
router.post("/api/chat/stream", authMiddleware([UserRole.ADMIN, UserRole.BUSINESS, UserRole.CUSTOMER]), streamChatCompletion);

export { router as chatRouter };