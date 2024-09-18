import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerBusiness } from "../controllers/business_register_business";
import proofBusinessUpload from "../middleware/fileUpload";

const router = express.Router();

//router.post("/api/business/registerBusiness", registerBusiness);
router.post("/api/business/registerBusiness", proofBusinessUpload.single('proof'), registerBusiness);

export { router as businessRegisterBusinessRouter }; 