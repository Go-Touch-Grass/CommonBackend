import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firstName,
            lastName,
            email,
            username,
            password

        } = req.body;


        const isUsernameAlreadyInUse = await Business_account.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);


        const business = Business_account.create({
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
        });


        await business.save();


        const token = jwt.sign(
            { id: business.business_id, username: business.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );


        res.status(201).json({
            business,
            token
        });

    } catch (error) {
        console.error('Error creating account:', error);


        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};


