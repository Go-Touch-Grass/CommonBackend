import express from "express";
import { authMiddleware } from "../middleware/auth";

import { createAccount, createOutlet, deleteAccount, deleteOutlet, loginAccount, logoutAccount, registerBusiness, resendOTP, retrieveProfile, updateProfile, uploadProfileImage, verifyOTP, viewSubscription, renewSubscription, createSubscription, createOutletSubscription, endSubscription, editSubscription, createVoucher, getAllVoucher, getVoucher, editVoucher, deleteVoucher, searchVouchers } from "../controllers/business";

import proofBusinessUpload, { profileImageUpload } from "../middleware/fileUpload";
import { UserRole } from "../entities/abstract/AbstractUser";


const router = express.Router();

router.post("/api/business/account", createAccount);
router.post("/api/business/verifyOTP", verifyOTP);
router.post("/api/business/resendOTP", resendOTP);
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

router.post("/api/business/create_voucher", authMiddleware([UserRole.BUSINESS]), createVoucher);
router.get("/api/business/vouchers", authMiddleware([UserRole.BUSINESS]), getAllVoucher);
router.get("/api/business/vouchers/:listing_id", authMiddleware([UserRole.BUSINESS]), getVoucher
);

router.put("/api/business/vouchers/:listing_id", authMiddleware([UserRole.BUSINESS]), editVoucher);

router.delete('/api/business/vouchers/:listing_id', authMiddleware([UserRole.BUSINESS]), deleteVoucher);
router.get("/api/business/vouchers/search", authMiddleware([UserRole.BUSINESS]), searchVouchers);


router.delete('/api/business/account', authMiddleware([UserRole.BUSINESS]), deleteAccount);
router.get('/api/business/subscription/:username', authMiddleware([UserRole.BUSINESS]), viewSubscription);
router.put('/api/business/renew_subscription', authMiddleware([UserRole.BUSINESS]), renewSubscription);
router.post('/api/business/subscription/:username', authMiddleware([UserRole.BUSINESS]), createSubscription);
router.post('/api/business/outlet/subscription/:username/:outletId', authMiddleware([UserRole.BUSINESS]), createOutletSubscription);
router.delete('/api/business/end_subscription', authMiddleware([UserRole.BUSINESS]), endSubscription)
router.put('/api/business/update_subscription/:subscriptionId', authMiddleware([UserRole.BUSINESS]), editSubscription)


export { router as businessRouter };
