import express from 'express';
import { getUserStripeIdAndEphemeralKey, createPaymentIntent, deletePaymentMethodId, getPaymentMethod, getPaymentMethodId, getUserEmailandUsername, savePaymentMethodId, finalizeGroupPurchase } from '../controllers/payment';
import { authMiddleware } from '../middleware/auth';
import { UserRole } from '../entities/abstract/AbstractUser';

const router = express.Router();

router.post('/api/payment/create-payment-intent', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), createPaymentIntent);
router.get('/api/payment/get-user-email-and-username', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), getUserEmailandUsername);
router.post('/api/payment/save-payment-method-id', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), savePaymentMethodId);
router.get('/api/payment/get-payment-method-id', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), getPaymentMethodId);
router.delete('/api/payment/delete-payment-method-id', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), deletePaymentMethodId);
router.get('/api/payment/get-payment-method', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), getPaymentMethod);
router.get('/api/payment/get-user-stripe-id-and-ephemeral-key', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), getUserStripeIdAndEphemeralKey);
router.post('/api/payment/group-purchase/finalize', authMiddleware([UserRole.BUSINESS, UserRole.CUSTOMER]), finalizeGroupPurchase);
export { router as paymentRouter };