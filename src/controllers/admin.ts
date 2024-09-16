import { Request, Response } from 'express';
import { Admin } from '../entities/Admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
            { id: admin.admin_id, username: admin.username },
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