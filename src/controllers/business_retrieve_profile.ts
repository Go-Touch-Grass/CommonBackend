import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';

export const retrieveProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        if (!username) {
            res.status(400).json({
                status: 400,
                message: 'Username is required',
            });
            return;
        }

        // Find the business account by username and include related outlets
        const business = await Business_account.findOne({
            where: { username },
            relations: ['outlets'], // Assuming the relation is called 'outlets' in your entity
        });

        if (!business) {
            res.status(404).json({
                status: 404,
                message: 'User not found',
            });
            return;
        }

        res.json({
            status: 200,
            business: {
                firstName: business.firstName,
                lastName: business.lastName,
                email: business.email,
                username: business.username,
            },
            outlets: business.outlets,
        });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
        });
    }
};
