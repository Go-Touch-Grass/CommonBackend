import { Request, Response } from 'express';
import { Customer_account } from '../entities/Customer_account';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            username,
            password
        } = req.body;

        const isUsernameAlreadyInUse = await Customer_account.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const customer_account = Customer_account.create({
            username,
            password: hashedPassword,
            role: 'customer'
        });

        await customer_account.save();

        const token = jwt.sign(
            { id: customer_account.customer_id, username: customer_account.username, role: customer_account.role }, 
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            customer_account,
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