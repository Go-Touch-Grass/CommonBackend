import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


export const loginAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;


        if (!username || !password) {
            res.status(400).json({
                status: 400,
                message: 'Username and password are required'
            });
            return;
        }


        const business = await Business_account.findOneBy({ username });

        if (!business) {
            res.status(401).json({
                status: 401,
                message: 'Invalid username or password'
            });
            return;
        }


        const isPasswordValid = await bcrypt.compare(password, business.password);

        if (!isPasswordValid) {
            res.status(401).json({
                status: 401,
                message: 'Invalid username or password'
            });
            return;
        }

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
        console.error(error);

        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
};
