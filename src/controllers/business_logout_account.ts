import { Request, Response } from 'express';

export const logoutAccount = async (req: Request, res: Response): Promise<void> => {
    try {

    
        // this part needs to probably implement middleware for authentication such that
        // the person who login is the one who logout

        res.status(200).json({
            status: 200,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);

        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
};
