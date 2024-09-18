import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';

// Function to retrieve profile
export const retrieveProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        if (!username) {
            res.status(400).json({
                status: 400,
                message: 'Username is required'
            });
            return;
        }

        const business = await Business_account.findOneBy({ username });

        if (!business) {
            res.status(404).json({
                status: 404,
                message: 'User not found'
            });
            return;
        }

        res.json(business);

    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};

// Function to update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { firstName, lastName, email } = req.body;

        if (!username) {
            res.status(400).json({
                status: 400,
                message: 'Username is required'
            });
            return;
        }

        if (!firstName && !lastName && !email) {
            res.status(400).json({
                status: 400,
                message: 'At least one field (firstName, lastName, or email) is required to update'
            });
            return;
        }

        const business = await Business_account.findOneBy({ username });

        if (!business) {
            res.status(404).json({
                status: 404,
                message: 'User not found'
            });
            return;
        }

        // Update profile fields only if provided
        if (firstName) business.firstName = firstName;
        if (lastName) business.lastName = lastName;
        if (email) business.email = email;

        await business.save();

        res.json({
            status: 200,
            message: 'Profile updated successfully',
            data: business
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            username,
        } = req.body;
        console.log("Request body: ", req.body);
        console.log("Request file: ", req.file);
        console.log(req.body.username);

        // Check if req.file is defined
        if (!req.file) {
            res.status(400).json({
                status: 400,
                message: 'Profile Image is required'
            });
            return; // Exit the function early if no file is provided
        }

        const businessAccount = await Business_account.findOneBy({ username });
        if (!businessAccount) {
            res.status(400).json({
                status: 400,
                message: 'Business Account not found'
            });
            return;
        }

        //const imagePath = req.file.path;  // Path of the uploaded file
        //businessAccount.profileImage = imagePath;  // store the file path or URL.
        const fileName = req.file.filename;  // Get the file name
        businessAccount.profileImage = `uploads/profileImages/${fileName}`;  // Save relative path in DB        
        await businessAccount.save();

        res.status(200).json({ message: 'Profile image uploaded successfully', imagePath: businessAccount.profileImage });


    } catch (error) {

        console.log(error);

        res.status(400).json({
            status: 400,
            message: error.message.toString()
        });
    }
}
