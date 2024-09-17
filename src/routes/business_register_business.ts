/*import express from "express";
import { authMiddleware } from "../middleware/auth";
import { registerBusiness } from "../controllers/business_register_business";
import upload from "../middleware/fileUpload";

const router = express.Router();

//router.post("/api/business/registerBusiness", registerBusiness);
router.post("/api/business/registerBusiness", upload.single('proof'), registerBusiness);

export { router as businessRegisterBusinessRouter }; */