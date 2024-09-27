import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import { BusinessAccountSubscription } from '../entities/Business_account_subscription';

export const viewSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business'] 
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        
        const business = businessAccount.business;
        const subscriptions = await BusinessAccountSubscription.find({
            where: { business_register_business: business },
            relations: ['outlet'] 
        });

        if (!subscriptions.length) {
            res.status(404).json({ status: 404, message: 'No subscriptions found for this business' });
            return;
        }

        
        const formattedSubscriptions = subscriptions.map(subscription => ({
            ...subscription,
            outlet_id: subscription.outlet ? subscription.outlet.outlet_id : null, 
        }));

        
        res.status(200).json({ status: 200, subscriptions: formattedSubscriptions });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};
