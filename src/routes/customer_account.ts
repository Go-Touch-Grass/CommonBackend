import express from "express";
import { authMiddleware } from "src/middleware/auth";
import { registerCustomer } from "../controllers/customer_account";

const router = express.Router();

router.post("/api/customer/register", registerCustomer);

export { router as customerAccountRouter };