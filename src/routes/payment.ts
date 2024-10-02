import express from 'express';
import { createPaymentIntent } from '../controllers/payment';

const router = express.Router();

router.post('/api/payment/create-payment-intent', createPaymentIntent);

export { router as paymentRouter };