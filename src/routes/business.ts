import express from "express";
import { authMiddleware } from "../middleware/auth";
import { createAccount, createOutlet, deleteOutlet, loginAccount, logoutAccount, registerBusiness, retrieveProfile, updateProfile, uploadProfileImage } from "../controllers/business";
import proofBusinessUpload, { profileImageUpload } from "../middleware/fileUpload";
import { UserRole } from "../entities/abstract/AbstractUser";

const router = express.Router();

router.post("/api/business/account", createAccount);
router.post("/api/business/login", loginAccount);
router.post("/api/business/logout", authMiddleware([UserRole.BUSINESS]), logoutAccount);

// Endpoint to retrieve account details
/*
removed username from routes, because username can be retrieved from token.
router.get('/api/business/profile/:username', authMiddleware([UserRole.BUSINESS]), retrieveProfile);
router.put('/api/business/profile/:username', authMiddleware([UserRole.BUSINESS]), updateProfile);
router.post('/api/business/profile/:username/uploadImage', profileImageUpload.single('profileImage'), authMiddleware([UserRole.BUSINESS]), uploadProfileImage);
*/
router.get('/api/business/profile', authMiddleware([UserRole.BUSINESS]), retrieveProfile);
router.put('/api/business/profile', authMiddleware([UserRole.BUSINESS]), updateProfile);
router.post('/api/business/profile/uploadImage', profileImageUpload.single('profileImage'), authMiddleware([UserRole.BUSINESS]), uploadProfileImage);


router.post("/api/business/registerBusiness", proofBusinessUpload.single('proof'), authMiddleware([UserRole.BUSINESS]), registerBusiness);
//router.post('/api/business/outlets/:username', authMiddleware([UserRole.BUSINESS]), createOutlet);
router.post('/api/business/outlets', authMiddleware([UserRole.BUSINESS]), createOutlet);
router.delete('/api/business/outlets/:outlet_id', authMiddleware([UserRole.BUSINESS]), deleteOutlet);

export { router as businessRouter };