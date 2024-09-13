import { Request, Response } from 'express';
import { Business } from '../entities/Business';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const registerBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            username,
            password,
            name
        } = req.body;

        const isUsernameAlreadyInUse = await Business.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const business = Business.create({
            username,
            password: hashedPassword,
            name
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