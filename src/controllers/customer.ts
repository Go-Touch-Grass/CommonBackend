import { Request, Response } from 'express';
import { Customer } from '../entities/Customer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            username,
            password,
            name
        } = req.body;

        const isUsernameAlreadyInUse = await Customer.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const customer = Customer.create({
            username,
            password: hashedPassword,
            name
        });

        await customer.save();

        const token = jwt.sign(
            { id: customer.customer_id, username: customer.username }, 
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            customer,
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