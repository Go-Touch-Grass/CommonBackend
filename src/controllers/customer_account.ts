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
            return; 
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
            { id: customer_account.id, username: customer_account.username, role: customer_account.role }, 
            process.env.JWT_SECRET as string,
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

export const loginCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const { login, password } = req.body;

        // Check if login is username or email
        const customer_account = await Customer_account.findOne({
            where: [{ username: login }, { email: login }]
        });

        if (!customer_account) {
            res.status(401).json({
                status: 401,
                message: 'Invalid credentials'
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, customer_account.password);

        if (!isPasswordValid) {
            res.status(401).json({
                status: 401,
                message: 'Invalid credentials'
            });
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const token = jwt.sign(
            { id: customer_account.id, username: customer_account.username, role: customer_account.role }, 
            process.env.JWT_SECRET as string,
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

export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const customer_account = await Customer_account.findOne({
            where: { id: userId },
            select: ['id', 'fullName', 'username', 'email']
        });

        if (!customer_account) {
            res.status(404).json({
                status: 404,
                message: 'User not found'
            });
            return;
        }

        res.json(customer_account);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
};