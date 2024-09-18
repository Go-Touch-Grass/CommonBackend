import { Request, Response } from 'express';
import { Outlet } from '../entities/Outlet';
import { Business_account } from '../entities/Business_account'; 
import { getRepository } from 'typeorm';


export const createOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { outlet_name, location, contact, description } = req.body;
        

        const business = await Business_account.findOneBy({ username });
        if (!business) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        const newOutlet = Outlet.create({
            outlet_name,
            location,
            contact,
            description,
            business
        });

        await newOutlet.save();

        res.status(201).json(newOutlet);
    } catch (error) {
        console.error('Error creating outlet:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
};



