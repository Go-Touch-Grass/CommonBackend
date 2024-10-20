import express from 'express';
import { createPaymentIntent, finalizeGroupPurchase } from '../controllers/payment';

const router = express.Router();

router.post('/api/payment/create-payment-intent', createPaymentIntent);
router.post('/api/payment/group-purchase/finalize', finalizeGroupPurchase);

export { router as paymentRouter };