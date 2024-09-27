import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import { BusinessAccountSubscription } from '../entities/Business_account_subscription';

export const renewSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, outlet_id, duration, distance_coverage } = req.body;

        // Log incoming request data for debugging
        console.log('Request body:', req.body);

        // Step 1: Find the business account by username
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business', 'gem_test']
        });

        // Check if the business account exists
        if (!businessAccount) {
            console.log(`Business account with username "${username}" not found.`);
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        console.log('Found business account:', businessAccount);

        // Step 2: Find the existing subscription by outlet ID (or main subscription)
        const existingSubscription = await BusinessAccountSubscription.findOne({
            where: { 
                business_register_business: businessAccount.business,
                outlet: outlet_id || null // Match outlet_id or main subscription (null)
            },
            relations: ['business_register_business']
        });

        // Check if the existing subscription is found
        if (!existingSubscription) {
            console.log(`No existing subscription found for outlet_id: ${outlet_id} and business: ${businessAccount.business}`);
            res.status(404).json({ status: 404, message: 'No existing subscription found to renew' });
            return;
        }

        console.log('Found existing subscription:', existingSubscription);

        // Step 3: Renew the subscription by updating activation and expiration dates
        const currentDate = new Date();
        const newExpirationDate = new Date(currentDate);

        // Extend the expiration date based on the duration from the current date
        newExpirationDate.setMonth(currentDate.getMonth() + duration);

        // Update subscription details
        existingSubscription.activation_date = currentDate;
        existingSubscription.expiration_date = newExpirationDate;
        existingSubscription.duration = duration; // Update duration
        existingSubscription.distance_coverage = distance_coverage; // Update distance coverage

        // Save the updated subscription
        await existingSubscription.save();

        // Log success message
        console.log('Subscription successfully renewed:', existingSubscription);

        // Step 4: Return the updated subscription to the client
        res.status(200).json({
            status: 200,
            message: 'Subscription successfully renewed',
            subscription: existingSubscription
        });
    } catch (error) {
        console.error('Error renewing subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};
