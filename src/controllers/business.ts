import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import { Business_register_business } from '../entities/Business_register_business';
import { Outlet } from '../entities/Outlet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { generateOTP, sendOTPEmail } from '../utils/otp';

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

        // Generate OTP and expiration time
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);  // Hash OTP for security
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);  // OTP valid for 10 minutes


        const business = Business_account.create({
            firstName,
            lastName,
            username,
            password: hashedPassword,
            email,
            otp: hashedOTP,
            otpExpiresAt
        });


        await business.save();

        // Send OTP to the user's email
        await sendOTPEmail(email, otp);

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

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {

        const { otp, userId } = req.body;

        const businessAccount = await Business_account.findOne({ where: { business_id: userId } });

        if (!businessAccount) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        // Check if the OTP is expired
        if (businessAccount.otpExpiresAt && businessAccount.otpExpiresAt < new Date()) {
            res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
            return;
        }

        // Verify the OTP
        const isOTPValid = await bcrypt.compare(otp, businessAccount.otp);
        if (!isOTPValid) {
            res.status(400).json({ message: 'Invalid OTP' });
            return;
        }

        // Clear the OTP and mark account as verified
        businessAccount.otp = "";
        businessAccount.otpExpiresAt = null;

        await businessAccount.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;
        const businessAccount = await Business_account.findOne({ where: { business_id: userId } });

        if (!businessAccount) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        // Generate a new OTP
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Update the account with new OTP
        businessAccount.otp = hashedOTP;
        businessAccount.otpExpiresAt = otpExpiresAt;

        await businessAccount.save();

        // Send the OTP to the user's email
        await sendOTPEmail(businessAccount.email, otp);

        res.status(200).json({ message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
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

        // Check if the account is soft-deleted
        if (business.deletedAt) {
            res.status(403).json({ message: 'This account has been deactivated.' });
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

        const isEmailVerified = !business.otp; // If OTP is null or empty, the email is verified


        const token = jwt.sign(
            { id: business.business_id, username: business.username, role: business.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            business,
            token,
            isEmailVerified, //send the verification status to frontend.
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

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;  // Get user from JWT token
        const { password } = req.body;

        const businessAccount = await Business_account.findOne({
            where: { business_id: userId },
            relations: ['business', 'outlets'] //relations for delete
        });
        console.log('Business Account found:', businessAccount);  // Log the account found

        if (!businessAccount) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        // Confirm the password
        if (!await bcrypt.compare(password, businessAccount.password)) {
            res.status(401).json({ message: 'Invalid password' });
            return;
        }

        await Business_account.update(userId, { deletedAt: new Date() }); //set deletedAt to current date for softdelete.
        //await Business_account.update(userId, { deletedAt: null }); //reactivate account.

        /* Converted to soft delete instead. 
        // Manually delete related entities before deleting the business account
        if (businessAccount.business) {
            await Business_register_business.remove(businessAccount.business);
        }
        if (businessAccount.outlets && businessAccount.outlets.length > 0) {
            await Outlet.remove(businessAccount.outlets);
        }

        await Business_account.remove(businessAccount); // delete the business account itself
        console.log('Account deleted successfully');  // Log success
        */
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
