import express from 'express';
import { authMiddleware } from '../middleware/auth'; // Ensure to use this if you need authentication
import { updateProfile } from '../controllers/business_edit_profile';
import { uploadProfileImage } from '../controllers/business_edit_profile';
import { profileImageUpload } from '../middleware/fileUpload';

const router = express.Router();

// Middleware for authentication (if needed)
//router.use(authMiddleware);

// Endpoint to retrieve account details
router.put('/api/business/profile/:username', updateProfile);

router.post('/api/business/profile/:username/uploadImage', profileImageUpload.single('profileImage'), uploadProfileImage);

export { router as businessEditAccountRouter };
