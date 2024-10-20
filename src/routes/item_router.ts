import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import { createItem, getItems, getItemById, createCustomItem } from "../controllers/item_controller";
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post("/api/items", authMiddleware([UserRole.ADMIN]), createItem);
router.post("/api/items/upload", authMiddleware([UserRole.ADMIN, UserRole.BUSINESS]), upload.single('image'), createCustomItem);
router.get("/api/items", getItems);
router.get("/api/items/:id", getItemById);

export { router as itemRouter };
