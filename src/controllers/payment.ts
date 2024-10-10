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
            name: user.username,
            description: user.role === UserRole.BUSINESS
                ? `Business account for ${user.username}`
                : `Customer account for ${user.username}`,
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

export const getUserEmailandUsername = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const user = await getUserFromDB(userId, userRole);

        res.status(200).json({
            email: user.email,
            username: user.username,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const savePaymentMethodId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { paymentMethodId } = req.body;

        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const user = await getUserFromDB(userId, userRole);

        // Attach the payment method to the user
        user.paymentMethodId = paymentMethodId;
        await user.save();

        res.status(200).json({ message: 'Payment method saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPaymentMethodId = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const user = await getUserFromDB(userId, userRole);

        res.status(200).json({ paymentMethodId: user.paymentMethodId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const deletePaymentMethodId = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const user = await getUserFromDB(userId, userRole);

        // Detach the payment method from the user
        user.paymentMethodId = null;
        await user.save();

        res.status(200).json({ message: 'Payment method deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const getPaymentMethod = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const user = await getUserFromDB(userId, userRole);

        if (!user.stripeId || !user.paymentMethodId) {
            // No saved payment method found, respond with an empty object
            res.status(200).json({ message: 'No saved payment method found.' });
            return;
        }

        const userStripeId = user.stripeId;
        const paymentMethodId = user.paymentMethodId;

        const paymentMethod = await stripe.customers.retrievePaymentMethod(userStripeId, paymentMethodId!);

        // Check if the payment method exists
        if (!paymentMethod) {
            res.status(200).json({ message: 'No saved payment method found.' });
            return;
        }

        // Respond with the payment method details
        res.json(paymentMethod);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}