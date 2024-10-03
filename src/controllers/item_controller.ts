import { Request, Response } from 'express';
import { Item, ItemType } from '../entities/Item';

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