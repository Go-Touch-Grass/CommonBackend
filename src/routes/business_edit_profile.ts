import express from 'express';
import { authMiddleware } from '../middleware/auth'; // Ensure to use this if you need authentication
import { updateProfile } from '../controllers/business_edit_profile';

const router = express.Router();

// Middleware for authentication (if needed)
//router.use(authMiddleware);

// Endpoint to retrieve account details
router.put('/api/business/profile/:username', updateProfile);

export { router as businessEditAccountRouter };
