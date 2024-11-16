import { Request, Response } from 'express';
import { Avatar } from '../entities/avatar.entity';
import { AvatarPrompt } from '../entities/avatarPrompt.entity';

export const createAvatarPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
        const { avatarId, prompt } = req.body;

        // Find the avatar
        const avatar = await Avatar.findOne({
            where: { id: avatarId },
            relations: ['prompt']
        });

        if (!avatar) {
            res.status(404).json({ message: 'Avatar not found' });
            return;
        }

        // Create new prompt
        const avatarPrompt = AvatarPrompt.create({
            prompt,
            avatar,
            avatarId
        });

        // Save the prompt and update the avatar
        await avatarPrompt.save();
        avatar.prompt = avatarPrompt;
        await avatar.save();

        res.status(201).json(avatarPrompt);
    } catch (error) {
        console.error('Error creating avatar prompt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateAvatarPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;

        const avatarPrompt = await AvatarPrompt.findOne({
            where: { id: parseInt(id) },
            relations: ['avatar']
        });

        if (!avatarPrompt) {
            res.status(404).json({ message: 'Avatar prompt not found' });
            return;
        }

        avatarPrompt.prompt = prompt;
        await avatarPrompt.save();

        res.json(avatarPrompt);
    } catch (error) {
        console.error('Error updating avatar prompt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAvatarPrompt = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const avatarPrompt = await AvatarPrompt.findOne({
            where: { id: parseInt(id) },
            relations: ['avatar']
        });

        if (!avatarPrompt) {
            res.status(404).json({ message: 'Avatar prompt not found' });
            return;
        }

        res.json(avatarPrompt);
    } catch (error) {
        console.error('Error fetching avatar prompt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAvatarPromptByAvatarId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { avatarId } = req.params;

        const avatarPrompt = await AvatarPrompt.findOne({
            where: { avatarId: parseInt(avatarId) },
            relations: ['avatar']
        });

        if (!avatarPrompt) {
            res.status(404).json({ message: 'Avatar prompt not found' });
            return;
        }

        res.json(avatarPrompt);
    } catch (error) {
        console.error('Error fetching avatar prompt:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};