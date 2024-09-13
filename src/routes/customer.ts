import express from "express";
import { authMiddleware } from "src/middleware/auth";
import { registerCustomer } from "../controllers/customer";

const router = express.Router();

router.post("/api/customer/register", registerCustomer);

export { router as customerRouter };