import express from "express";
import { registerAvatar } from "../controllers/business_register_avatar";
import { avatarFileUpload } from "../middleware/fileUpload";

const router = express.Router();
router.post(
  "/api/business/avatarRequest",
  avatarFileUpload.single("avatarFile"),
  registerAvatar
);

export { router as businessRegisterAvatarRouter };
