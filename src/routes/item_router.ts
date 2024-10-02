import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createItem, getItems, getItemById } from "../controllers/item_controller";
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post("/api/items", authMiddleware([UserRole.ADMIN]), createItem);
router.get("/api/items", getItems);
router.get("/api/items/:id", getItemById);

export { router as itemRouter };