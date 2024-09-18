import express from 'express';
import { authMiddleware } from '../middleware/auth'; // Ensure to use this if you need authentication
import { retrieveProfile } from '../controllers/business_retrieve_profile';

const router = express.Router();

// Middleware for authentication (if needed)
//router.use(authMiddleware);

// Endpoint to retrieve account details
router.get('/api/business/profile/:username', retrieveProfile);

export { router as businessRetrieveAccountRouter };
