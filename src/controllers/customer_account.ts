import { Request, Response } from 'express';
import { Customer_account } from '../entities/Customer_account';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const registerCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, username, email, password } = req.body;

        // Check if username or email is already in use
        const existingUser = await Customer_account.findOne({
            where: [{ username }, { email }]
        });

        if (existingUser) {
            res.status(400).json({
                status: 400,
                message: existingUser.username === username ? 'Username already in use' : 'Email already in use'
            });
            return; // Add this line to exit the function after sending the response
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const customer_account = Customer_account.create({
            fullName,
            username,
            email,
            password: hashedPassword,
        });

        await customer_account.save();

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { id: customer_account.id, username: customer_account.username }, 
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            customer_account,
            token
        });

    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 400,
            message: error.message
        });
    }
};