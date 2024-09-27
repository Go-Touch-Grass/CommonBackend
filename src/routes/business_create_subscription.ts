import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createSubscription} from "../controllers/business_create_subscription";

const router = express.Router();

router.post('/api/business/subscription/:username', createSubscription);

export { router as businessSubscriptionRouter }