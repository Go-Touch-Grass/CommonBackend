import { Request, Response } from 'express';
import { Admin } from '../entities/Admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Business } from '../entities/Business';
import { Customer_account } from '../entities/Customer_account';

export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOneBy({ username });

        if (!admin) {
            res.status(400).json({
                status: 400,
                message: 'Invalid username or password'
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            res.status(400).json({
                status: 400,
                message: 'Invalid username or password'
            });
            return;
        }

        const token = jwt.sign(
            { id: admin.admin_id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            admin,
            token
        });

    } catch (error) {

        console.log(error);

        res.status(400).json({
            status: 400,
            message: error.message.toString()
        });
    }
}

export const getAllBusinesses = async (req: Request, res: Response): Promise<void> => {
    try {
        const businesses = await Business.find(); // Fetch all businesses
        res.status(200).json(businesses);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch businesses'
        });
    }
}

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const customers = await Customer_account.find(); // Fetch all customers
        res.status(200).json(customers);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch customers'
        });
    }
}