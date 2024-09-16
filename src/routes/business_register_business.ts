import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerBusiness } from "../controllers/business_register_business";

const router = express.Router();

router.post("/api/business/registerBusiness", registerBusiness);

export { router as businessRegisterBusinessRouter };