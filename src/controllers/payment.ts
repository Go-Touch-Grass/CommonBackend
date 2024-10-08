import { Request, Response } from 'express';
import { stripe } from '../index';
import { UserRole } from '../entities/abstract/AbstractUser';
import { Business_account } from '../entities/Business_account';
import { Customer_account } from '../entities/Customer_account';

const getUserFromDB = async (userId: number, userRole: UserRole): Promise<Business_account | Customer_account> => {
    let user: Business_account | Customer_account | null = null;

    if (userRole === UserRole.BUSINESS) {
        // Retrieve business from database
        user = await Business_account.findOne({ where: { business_id: userId } });
    } else if (userRole === UserRole.CUSTOMER) {
        // Retrieve customer from database
        user = await Customer_account.findOne({ where: { id: userId } });
    }
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

const createOrGetUserStripeId = async (userId: number, userRole: UserRole): Promise<string> => {
    const user = await getUserFromDB(userId, userRole);

    if (!user.stripeId) {
        // Create a new Stripe customer
        const stripeCustomer = await stripe.customers.create({
            email: user.email,
            description: user.role === UserRole.BUSINESS ? 'Business account' : 'Customer account',
        });
        user.stripeId = stripeCustomer.id;
        await user.save();
    }
    return user.stripeId;
}

export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, currency } = req.body;

        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const userStripeId = await createOrGetUserStripeId(userId, userRole);

        // Create a PaymentIntent with the amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // amount in the smallest unit of the currency (e.g., cents for USD)
            currency: currency, // e.g., 'usd'
            customer: userStripeId,
            payment_method_types: ['card'],
            setup_future_usage: 'on_session',
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