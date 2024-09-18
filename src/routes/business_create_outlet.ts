import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createOutlet} from "../controllers/business_create_outlet";

const router = express.Router();

router.post('/api/business/outlets', createOutlet);

export { router as businessCreateOutletRouter };