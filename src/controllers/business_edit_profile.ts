import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';

// Function to retrieve profile
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

// Function to update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { firstName, lastName, email } = req.body;

        if (!username) {
            res.status(400).json({
                status: 400,
                message: 'Username is required'
            });
            return;
        }

        if (!firstName && !lastName && !email) {
            res.status(400).json({
                status: 400,
                message: 'At least one field (firstName, lastName, or email) is required to update'
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

        // Update profile fields only if provided
        if (firstName) business.firstName = firstName;
        if (lastName) business.lastName = lastName;
        if (email) business.email = email;

        await business.save();

        res.json({
            status: 200,
            message: 'Profile updated successfully',
            data: business
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};
