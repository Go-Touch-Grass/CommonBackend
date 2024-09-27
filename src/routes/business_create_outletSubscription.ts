import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createOutletSubscription} from "../controllers/business_create_outletSubscription";

const router = express.Router();

router.post('/api/business/outlet/subscription/:username/:outletId', createOutletSubscription);

export { router as businessOutletSubscriptionRouter }