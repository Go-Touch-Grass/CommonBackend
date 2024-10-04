import { Request, Response } from 'express';
import { stripe } from '../index';

export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, currency } = req.body;
    
        // Create a PaymentIntent with the amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount, // amount in the smallest unit of the currency (e.g., cents for USD)
          currency: currency, // e.g., 'usd'
        });
    
        // Send client secret to the frontend
        res.status(200).json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};