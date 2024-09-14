import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Sign up and Login account for business
export const createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firstName,
            lastName,
            username = firstName.concat(lastName),
            email,
            password
        } = req.body;

        const isUsernameAlreadyInUse = await Business_account.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const business = Business_account.create({
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

        res.json({
            business,
            token
        });

    } catch (error) {

        console.log(error);

        res.status(400).json({
            status: 400,
            message: error.message.toString()
        });
    }
};