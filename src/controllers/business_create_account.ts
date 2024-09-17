import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        // Extract fields from request body
        const {
            firstName,
            lastName,
            email,
            username,
            password
        } = req.body;

        // Check if username is already in use
        const isUsernameAlreadyInUse = await Business_account.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
            return; // Exit the function to avoid further execution
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new business account
        const business = Business_account.create({
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
        });

        // Save the business account to the database
        await business.save();

        // Generate a JWT token
        const token = jwt.sign(
            { id: business.business_id, username: business.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        // Respond with business account details and token
        res.status(201).json({
            business,
            token
        });

    } catch (error) {
        console.error('Error creating account:', error); // Improved logging

        // Respond with an error status and message
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};
