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
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['outlets', 'business'], // Assuming the relation is called 'outlets' in your entity
        });

        if (!businessAccount) {
            res.status(404).json({
                status: 404,
                message: 'User not found',
            });
            return;
        }

        res.json({
            status: 200,
            business: {
                firstName: businessAccount.firstName,
                lastName: businessAccount.lastName,
                email: businessAccount.email,
                username: businessAccount.username,
                profileImage: businessAccount.profileImage, // Return image path
            },
            outlets: businessAccount.outlets,
            registeredBusiness: businessAccount.business
        });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
        });
    }
};


