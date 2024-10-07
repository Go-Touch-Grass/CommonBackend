import { Request, Response } from 'express';
import { Avatar, AvatarType } from '../entities/Avatar';
import { Customer_account } from '../entities/Customer_account';
import { Business_account } from '../entities/Business_account';
import { Item, ItemType } from '../entities/Item';

export const createAvatar = async (req: Request, res: Response): Promise<void> => {
    try {
        const { avatarType, baseId, hatId, shirtId, bottomId } = req.body;
        const userId = (req as any).user.id; // Get user ID from authenticated request

        let avatar: Avatar;

        if (avatarType === AvatarType.TOURIST) {
            const customer = await Customer_account.findOneOrFail({ where: { id: userId } });
            avatar = Avatar.create({
                avatarType,
                customer,
            });
            // Update the customer's avatar
            customer.avatar = avatar;
            await customer.save();
        } else if (avatarType === AvatarType.BUSINESS) {
            const business = await Business_account.findOneOrFail({ where: { business_id: userId } });
            avatar = Avatar.create({
                avatarType,
                business,
            });
        } else {
            res.status(400).json({ message: 'Invalid avatar type' });
            return;
        }

        // Set base item (required)
        if (!baseId) {
            res.status(400).json({ message: 'Base item is required' });
            return;
        }
        avatar.base = await Item.findOneOrFail({ where: { id: baseId, type: ItemType.BASE } });

        // Set optional items
        if (hatId) avatar.hat = await Item.findOneOrFail({ where: { id: hatId, type: ItemType.HAT } });
        if (shirtId) avatar.shirt = await Item.findOneOrFail({ where: { id: shirtId, type: ItemType.SHIRT } });
        if (bottomId) avatar.bottom = await Item.findOneOrFail({ where: { id: bottomId, type: ItemType.BOTTOM } });

        await avatar.save();

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
            relations: ['customer', 'business', 'base', 'hat', 'shirt', 'bottom']
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
        const { baseId, hatId, shirtId, bottomId } = req.body;

        const avatar = await Avatar.findOne({ where: { id: parseInt(id) } });

        if (!avatar) {
            res.status(404).json({ message: 'Avatar not found' });
            return;
        }

        // Update base (required item, cannot be unequipped)
        if (baseId) {
            avatar.base = await Item.findOneOrFail({ where: { id: baseId, type: ItemType.BASE } });
        }

        // Update optional items (can be unequipped by setting to null)
        if (hatId === null) {
            avatar.hat = null;
        } else if (hatId) {
            avatar.hat = await Item.findOneOrFail({ where: { id: hatId, type: ItemType.HAT } });
        }

        if (shirtId === null) {
            avatar.shirt = null;
        } else if (shirtId) {
            avatar.shirt = await Item.findOneOrFail({ where: { id: shirtId, type: ItemType.SHIRT } });
        }

        if (bottomId === null) {
            avatar.bottom = null;
        } else if (bottomId) {
            avatar.bottom = await Item.findOneOrFail({ where: { id: bottomId, type: ItemType.BOTTOM } });
        }

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
            relations: ['customer', 'base', 'hat', 'shirt', 'bottom']
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

export const getAvatarsByBusinessUsername = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        // Find the business account by username
        const business = await Business_account.findOne({ where: { username } });

        if (!business) {
            res.status(404).json({ message: 'Business not found' });
            return;
        }

        const avatars = await Avatar.find({
            where: { business: { business_id: business.business_id } },
            relations: ['business', 'base', 'hat', 'shirt', 'bottom']
        });

        if (!avatars || avatars.length === 0) {
            res.status(404).json({ message: 'No avatars found for this business' });
            return;
        }

        res.json(avatars);
    } catch (error) {
        console.error('Error fetching avatars by business username:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};