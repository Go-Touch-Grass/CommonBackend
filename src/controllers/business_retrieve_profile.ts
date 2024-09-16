import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';

export const retrieveProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        if (!username) {
            res.status(400).json({
                status: 400,
                message: 'Username is required'
            });
            return;
        }

        const business = await Business_account.findOneBy({ username });

        if (!business) {
            res.status(404).json({
                status: 404,
                message: 'User not found'
            });
            return;
        }

        res.json(business);

    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};
