import express from "express";
import { authMiddleware } from "src/middleware/auth";
import { registerCustomerProfile } from "../controllers/customer_profile";

const router = express.Router();

router.post("/api/customer/:customerId/profile", registerCustomerProfile);

export { router as customerProfileRouter };