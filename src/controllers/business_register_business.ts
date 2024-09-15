
import { Request, Response } from 'express';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Business_register_business } from '../entities/Business_register_business';

// For registering their business after the creation of account 
export const registerBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            entityName,
            location,
            category,
        } = req.body;

        const isUsernameAlreadyInUse = await Business_register_business.findOneBy({ entityName });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Business EntityName already in use'
            });
        }

        const registeredBusiness = Business_register_business.create({
            entityName,
            location,
            category,
        });

        await registeredBusiness.save();

        res.json({
            registeredBusiness
        });

    } catch (error) {

        console.log(error);

        res.status(400).json({
            status: 400,
            message: error.message.toString()
        });
    }
};

