import { Request, Response } from 'express';
import { Item, ItemType } from '../entities/Item';
import cloudinary from '../config/cloudinary';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Business_register_business } from '../entities/Business_register_business';
import { Outlet } from '../entities/Outlet';

const upload = multer({ dest: 'uploads/' });

export const createItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, filepath, approved } = req.body;

        const item = Item.create({
            name,
            type,
            filepath,
            approved: approved || false
        });

        await item.save();

        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const items = await Item.find({ where: { approved: true } });
        res.json(items);
    } catch (error) {
        console.error('Error fetching approved items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const item = await Item.findOne({ where: { id: parseInt(id) } });

        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }

        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createCustomItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, scale, xOffset, yOffset, businessRegistrationId, outletId } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            public_id: `custom_items/${uuidv4()}`,
            tags: ['custom_item'],
            transformation: [
                { width: scale, height: scale, crop: 'scale' },
                { x: xOffset, y: yOffset }
            ]
        });

        // Create new item entity
        const item = Item.create({
            name,
            type,
            filepath: result.secure_url,
            approved: false,
        });

        if (businessRegistrationId) {
            const business = await Business_register_business.findOne({ where: { registration_id: businessRegistrationId } });
            if (!business) {
                res.status(404).json({ message: 'Business not found' });
                return;
            }
            item.business_register_business = business;
        } else if (outletId) {
            const outlet = await Outlet.findOne({ where: { outlet_id: outletId } });
            if (!outlet) {
                res.status(404).json({ message: 'Outlet not found' });
                return;
            }
            item.outlet = outlet;
        } else {
            res.status(400).json({ message: 'Either businessRegistrationId or outletId must be provided' });
            return;
        }

        await item.save();

        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating custom item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
