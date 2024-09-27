import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account'; 
import { BusinessAccountSubscription } from '../entities/Business_account_subscription'; 

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { duration, distance_coverage } = req.body;


        const pricing = {
            base: {
                1: { price: 50, gems: 500 },
                2: { price: 90, gems: 900 },
                3: { price: 120, gems: 1200 },
            },
            extra: {
                1: { price: 10, gems: 100 },
                2: { price: 18, gems: 180 },
                3: { price: 25, gems: 250 },
            },
        };

        
        const total_gem = parseInt(pricing.base[duration].gems + (pricing.extra[distance_coverage]?.gems || 0) * duration);

        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business', 'gem_test']
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        const gemAccount = businessAccount.gem_test;

        console.log('Current gem balance:', gemAccount.balance);
        console.log('Total gems to spend:', total_gem);


        if (gemAccount.balance < total_gem) {
            res.status(400).json({ status: 400, message: 'Not enough gems in the account' });
            return;
        }

        gemAccount.balance -= total_gem;
        await gemAccount.save();

    
        const businessAccountSubscription = BusinessAccountSubscription.create({
            duration,
            distance_coverage,
            total_cost: pricing.base[duration].price + (pricing.extra[distance_coverage]?.price || 0) * duration,
            total_gem,
            title: `${duration} Month Plan`,
            description: `Subscription for ${duration} month(s) with ${distance_coverage} km coverage.`,
            business_register_business: businessAccount.business // Use the correct property name
        });

        await businessAccountSubscription.save();

        res.status(201).json(businessAccountSubscription);
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};
