import express from 'express';
import { createPaymentIntent } from '../controllers/payment';
import { authMiddleware } from '../middleware/auth';
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post('/api/payment/create-payment-intent', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), createPaymentIntent);

export { router as paymentRouter };