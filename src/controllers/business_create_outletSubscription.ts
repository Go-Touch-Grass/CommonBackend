import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account'; 
import { BusinessAccountSubscription } from '../entities/Business_account_subscription'; 
import { Outlet } from '../entities/Outlet';

export const createOutletSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, outletId } = req.params; // Assuming outletId is passed in params
        const { duration, distance_coverage, total_cost, total_gem, title, description } = req.body;

        // Log incoming data for debugging
        console.log('Incoming request data:', { username, outletId, duration, distance_coverage, total_cost, total_gem, title, description });

        // Fetch the business account
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business']
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        // Fetch the outlet
        const outlet = await Outlet.findOne({
            where: { outlet_id: parseInt(outletId, 10) } // Ensure outletId is parsed correctly
        });

        if (!outlet) {
            res.status(404).json({ status: 404, message: 'Outlet not found' });
            return;
        }

        const business = businessAccount.business;

        // Get the current date for activation
        const activationDate = new Date();

        // Calculate expiration date correctly
        const expirationDate = new Date(activationDate);
        expirationDate.setMonth(activationDate.getMonth() + duration);

        // Log dates for debugging
        console.log('Activation Date:', activationDate);
        console.log('Expiration Date before adjustment:', expirationDate);

        // Adjust for overflow, ensuring the day doesn't overflow to the next month
        if (expirationDate.getDate() < activationDate.getDate()) {
            expirationDate.setMonth(expirationDate.getMonth() + 1);
        }

        // Log final expiration date
        console.log('Final Expiration Date:', expirationDate);

        // Create a new subscription entry
        const businessAccountSubscription = BusinessAccountSubscription.create({
            duration,
            distance_coverage,
            total_cost,
            total_gem,
            title,
            description,
            activation_date: activationDate, // Set activation date
            expiration_date: expirationDate, // Set expiration date
            business_register_business: business,
            outlet: outlet
        });

        await businessAccountSubscription.save();

        // Format dates for response
        const formattedActivationDate = activationDate.toLocaleDateString('en-US');
        const formattedExpirationDate = expirationDate.toLocaleDateString('en-US');

        res.status(201).json({
            message: 'Subscription created successfully',
            subscription: {
                duration,
                distance_coverage,
                total_cost,
                total_gem,
                title,
                description,
                activation_date: formattedActivationDate, // Send formatted date
                expiration_date: formattedExpirationDate, // Send formatted date
                business_register_business: business,
                outlet: outlet
            }
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};
