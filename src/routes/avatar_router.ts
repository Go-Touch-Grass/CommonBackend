import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createAvatar, getAvatarById, updateAvatar, getAvatarByCustomerId, getAvatarByOutletId, getAvatarByBusinessRegistrationId } from "../controllers/avatar_controller";
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post("/api/avatars", authMiddleware([UserRole.CUSTOMER, UserRole.BUSINESS]), createAvatar);
router.get("/api/avatars/:id", authMiddleware([UserRole.CUSTOMER, UserRole.BUSINESS]), getAvatarById);
router.put("/api/avatars/:id", authMiddleware([UserRole.CUSTOMER, UserRole.BUSINESS]), updateAvatar);
router.get("/api/avatars/customer/:customerId", authMiddleware([UserRole.CUSTOMER]), getAvatarByCustomerId);
//router.get("/api/business/avatars/:username", authMiddleware([UserRole.BUSINESS]), getAvatarsByBusinessUsername);
router.get("/api/avatars/business/:registration_id", authMiddleware([UserRole.CUSTOMER]), getAvatarByBusinessRegistrationId);
router.get("/api/avatars/outlet/:outlet_id", authMiddleware([UserRole.CUSTOMER]), getAvatarByOutletId);

export { router as avatarRouter };