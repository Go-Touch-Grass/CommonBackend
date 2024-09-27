import express from "express";
import { authMiddleware } from "../middleware/auth";
import { viewSubscription} from "../controllers/business_view_subscription";

const router = express.Router();

router.get('/api/business/subscription/:username', viewSubscription);

export { router as businessViewSubscriptionRouter }