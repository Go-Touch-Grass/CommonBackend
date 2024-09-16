import express from "express";
import { authMiddleware } from "../middleware/auth";
import { loginAdmin } from "../controllers/admin";

const router = express.Router();

router.post("/api/admin/login", loginAdmin);

export { router as adminRouter };