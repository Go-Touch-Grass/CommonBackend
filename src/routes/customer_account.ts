import express from "express";
import { authMiddleware } from "src/middleware/auth";
import { registerCustomer, loginCustomer } from "../controllers/customer_account";

const router = express.Router();

router.post("/auth/register", registerCustomer);
router.post("/auth/login", loginCustomer);

export { router as customerAccountRouter };