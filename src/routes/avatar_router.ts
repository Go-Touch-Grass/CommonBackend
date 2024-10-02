import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createAvatar, getAvatarById, updateAvatar } from "../controllers/avatar_controller";
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post("/api/avatars", authMiddleware([UserRole.CUSTOMER, UserRole.BUSINESS]), createAvatar);
router.get("/api/avatars/:id", authMiddleware([UserRole.CUSTOMER, UserRole.BUSINESS]), getAvatarById);
router.put("/api/avatars/:id", authMiddleware([UserRole.CUSTOMER, UserRole.BUSINESS]), updateAvatar);

export { router as avatarRouter };