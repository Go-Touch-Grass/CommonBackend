import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createAvatarPrompt, updateAvatarPrompt, getAvatarPrompt, getAvatarPromptByAvatarId } from "../controllers/avatarPrompt.controller";
import { UserRole } from '../entities/abstract/abstractUser.entity';

const router = express.Router();

// Only allow business users to create/edit prompts
router.post("/api/avatars/business/prompt", authMiddleware([UserRole.BUSINESS]), createAvatarPrompt);
router.put("/api/avatars/business/prompt/:id", authMiddleware([UserRole.BUSINESS]), updateAvatarPrompt);
// router.get("/api/avatars/business/prompt/:id", authMiddleware([UserRole.BUSINESS]), getAvatarPrompt);
router.get("/api/avatars/business/prompt/:avatarId", authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), getAvatarPromptByAvatarId);

export { router as avatarPromptRouter };