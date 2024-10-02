import { Request, Response } from 'express';
import { Item, ItemType } from '../entities/Item';

export const createItem = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, filepath } = req.body;

        const item = Item.create({
            name,
            type,
            filepath
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
        const items = await Item.find();
        console.log('Fetched items:', items); // Add this line for debugging
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
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