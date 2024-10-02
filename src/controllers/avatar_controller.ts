import { Request, Response } from 'express';
import { Avatar, AvatarType } from '../entities/Avatar';
import { Customer_account } from '../entities/Customer_account';
import { Business_account } from '../entities/Business_account';
import { Item } from '../entities/Item';

export const createAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { avatarType, hatId, shirtId, bottomId } = req.body;
        const userId = (req as any).user.id; // Get user ID from authenticated request

        const customer = await Customer_account.findOneOrFail({ where: { id: userId } });

        const avatar = Avatar.create({
            avatarType,
            customer,
        });

        if (hatId) avatar.hat = await Item.findOneOrFail({ where: { id: hatId } });
        if (shirtId) avatar.shirt = await Item.findOneOrFail({ where: { id: shirtId } });
        if (bottomId) avatar.bottom = await Item.findOneOrFail({ where: { id: bottomId } });

        await avatar.save();

        // Update the customer's avatar
        customer.avatar = avatar;
        await customer.save();

        res.status(201).json({ avatar, avatarId: avatar.id });
    } catch (error) {
        console.error('Error creating avatar:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAvatarById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const avatar = await Avatar.findOne({
            where: { id: parseInt(id) },
            relations: ['customer', 'business', 'hat', 'shirt', 'bottom']
        });

        if (!avatar) {
            res.status(404).json({ message: 'Avatar not found' });
            return;
        }

        res.json(avatar);
    } catch (error) {
        console.error('Error fetching avatar:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { hatId, shirtId, bottomId } = req.body;

        const avatar = await Avatar.findOne({ where: { id: parseInt(id) } });

        if (!avatar) {
            res.status(404).json({ message: 'Avatar not found' });
            return;
        }

        if (hatId) avatar.hat = await Item.findOneOrFail({ where: { id: hatId } });
        if (shirtId) avatar.shirt = await Item.findOneOrFail({ where: { id: shirtId } });
        if (bottomId) avatar.bottom = await Item.findOneOrFail({ where: { id: bottomId } });

        await avatar.save();

        res.json(avatar);
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAvatarByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customerId } = req.params;
        
        const avatar = await Avatar.findOne({
            where: { customer: { id: parseInt(customerId) } },
            relations: ['customer', 'hat', 'shirt', 'bottom']
        });

        if (!avatar) {
            res.status(404).json({ message: 'Avatar not found for this customer' });
            return;
        }

        res.json(avatar);
    } catch (error) {
        console.error('Error fetching avatar by customer ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};