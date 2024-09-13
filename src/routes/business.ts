import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerBusiness } from "../controllers/business";

const router = express.Router();

router.post("/api/business/register", registerBusiness);

export { router as businessRouter };