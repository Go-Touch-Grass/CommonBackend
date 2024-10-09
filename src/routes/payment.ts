import express from 'express';
import { createPaymentIntent, getUserEmailandUsername, savePaymentMethodId } from '../controllers/payment';
import { authMiddleware } from '../middleware/auth';
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post('/api/payment/create-payment-intent', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), createPaymentIntent);
router.get('/api/payment/get-user-email-and-username', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), getUserEmailandUsername);
router.post('/api/payment/save-payment-method-id', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), savePaymentMethodId);

export { router as paymentRouter };