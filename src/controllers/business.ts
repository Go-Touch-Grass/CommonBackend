import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import { Business_register_business } from '../entities/Business_register_business';
import { Outlet } from '../entities/Outlet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const createAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            firstName,
            lastName,
            email,
            username,
            password

        } = req.body;


        const isUsernameAlreadyInUse = await Business_account.findOneBy({ username });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Username already in use'
            });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);


        const business = Business_account.create({
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
        });


        await business.save();


        const token = jwt.sign(
            { id: business.business_id, username: business.username, role: business.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );


        res.status(201).json({
            business,
            token
        });

    } catch (error) {
        console.error('Error creating account:', error);


        res.status(500).json({
            status: 500,
            message: 'Internal Server Error'
        });
    }
};


export const loginAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;


        if (!username || !password) {
            res.status(400).json({
                status: 400,
                message: 'Username and password are required'
            });
            return;
        }


        const business = await Business_account.findOneBy({ username });

        if (!business) {
            res.status(401).json({
                status: 401,
                message: 'Invalid username or password'
            });
            return;
        }


        const isPasswordValid = await bcrypt.compare(password, business.password);

        if (!isPasswordValid) {
            res.status(401).json({
                status: 401,
                message: 'Invalid username or password'
            });
            return;
        }

        const token = jwt.sign(
            { id: business.business_id, username: business.username, role: business.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            business,
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: 500,
            message: 'Internal server error'
        });
    }
};

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

export const retrieveProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        //const { username } = req.params;
        const username = (req as any).user.username;

        if (!username) {
            res.status(400).json({
                status: 400,
                message: 'Username is required',
            });
            return;
        }

        // Find the business account by username and include related outlets
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['outlets', 'business'], // Assuming the relation is called 'outlets' in your entity
        });

        if (!businessAccount) {
            res.status(404).json({
                status: 404,
                message: 'User not found',
            });
            return;
        }

        res.json({
            status: 200,
            business: {
                firstName: businessAccount.firstName,
                lastName: businessAccount.lastName,
                email: businessAccount.email,
                username: businessAccount.username,
                profileImage: businessAccount.profileImage, // Return image path
            },
            outlets: businessAccount.outlets,
            registeredBusiness: businessAccount.business
        });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
        });
    }
};




// Function to update profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        //const { username } = req.params;
        const username = (req as any).user.username;
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
        /*
        const {
            username,
        } = req.body;
        console.log("Request body: ", req.body);
        console.log(req.body.username);
        */
        const username = (req as any).user.username;
        console.log("Request file: ", req.file);


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


// For registering their business after the creation of account 
export const registerBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const username = (req as any).user.username;
        const {
            entityName,
            location,
            category,
            //username,
        } = req.body;
        console.log("Request body: ", req.body);
        console.log("Request file: ", req.file);
        //console.log(req.body.username);
        const isUsernameAlreadyInUse = await Business_register_business.findOneBy({ entityName });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Business EntityName already in use'
            });
        }

        // Check if req.file is defined
        if (!req.file) {
            res.status(400).json({
                status: 400,
                message: 'Proof file (image or PDF) is required'
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

        const registeredBusiness = Business_register_business.create({
            entityName,
            location,
            category,
            //proof: req.file.path, // store the file path or URL.
            proof: `uploads/proofOfBusiness/${req.file.filename}`, // store relative path
            status: 'pending',
            remarks: "",
            business_account: businessAccount // Link the business_account entity to business_register_business
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

export const createOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        //const { username } = req.params;
        const username = (req as any).user.username;
        const { outlet_name, location, contact, description } = req.body;

        console.log(username);

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

export const deleteOutlet = async (req: Request, res: Response): Promise<void> => {

    try {
        const { outlet_id } = req.params;
        const userId = (req as any).user.id;

        const outletID = parseInt(outlet_id);
        const outlet = await Outlet.findOneBy({ outlet_id: outletID });
        if (!outlet) {
            res.status(404).json({
                status: 404,
                message: 'Outlet not found',
            });
            return;
        }

        await outlet.remove(); // delete the outlet
        res.json({
            status: 200,
            message: 'Outlet deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting outlet:', error);
        res.status(500).json({
            status: 500,
            message: 'Internal Server Error',
        });
    }

}
