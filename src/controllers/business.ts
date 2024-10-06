import { Request, Response } from 'express';
import { Business_account } from '../entities/Business_account';
import { Business_register_business } from '../entities/Business_register_business';
import { Outlet } from '../entities/Outlet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { generateOTP, sendOTPEmail, sendSubscriptionRenewEmail } from '../utils/otp';
import { BusinessAccountSubscription } from '../entities/Business_account_subscription';
import { Business_transaction } from '../entities/Business_transaction';
import { addMonths } from 'date-fns'; // Import a helper function for date manipulation
import { Between, getRepository } from 'typeorm';
import { Business_voucher } from '../entities/Business_voucher';
import { IsNull } from 'typeorm';

export const editSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params; // Assuming username is passed in params
        const { subscriptionId, duration, distance_coverage } = req.body;

        // Pricing structure
        const pricing = {
            base: {
                1: { price: 50, gems: 500 },
                2: { price: 90, gems: 900 },
                3: { price: 120, gems: 1200 },
            },
            extra: {
                1: { price: 10, gems: 100 },
                2: { price: 18, gems: 180 },
                3: { price: 25, gems: 250 },
            },
        };

        // Fetch current subscription
        const currentSubscription = await BusinessAccountSubscription.findOne({
            where: { subscription_id: subscriptionId },
            relations: ['business_register_business'],
        });

        if (!currentSubscription) {
            res.status(404).json({ status: 404, message: 'Subscription not found' });
            return;
        }

        // Check if attempting to downgrade
        if (duration < currentSubscription.duration || distance_coverage < currentSubscription.distance_coverage) {
            res.status(400).json({ status: 400, message: 'Downgrading is not allowed' });
            return;
        }

        // Calculate total gems needed
        const total_gem = pricing.base[duration].gems + (pricing.extra[distance_coverage]?.gems || 0);

        // Fetch business account
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business'],
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        // Check gem balance
        if (businessAccount.gem_balance < total_gem) {
            res.status(400).json({ status: 400, message: 'Not enough gems in the account' });
            return;
        }

        // Deduct gems
        businessAccount.gem_balance -= total_gem;
        await businessAccount.save();

        // Update subscription details
        currentSubscription.duration = duration;
        currentSubscription.distance_coverage = distance_coverage;
        currentSubscription.total_cost = pricing.base[duration].price + (pricing.extra[distance_coverage]?.price || 0);
        currentSubscription.total_gem = total_gem;
        currentSubscription.title = `${duration} Month Plan`;
        currentSubscription.description = `Subscription for ${duration} month(s) with ${distance_coverage} km coverage.`;

        // Update the expiration date
        currentSubscription.expiration_date = addMonths(new Date(currentSubscription.activation_date), duration);

        // Save the updated subscription
        const savedSubscription = await currentSubscription.save();
        console.log('Updated Subscription:', savedSubscription); // Log the updated subscription

        // Respond with the updated subscription
        res.status(200).json(savedSubscription);
    } catch (error) {
        console.error('Error editing subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: (error as Error).message });
    }
};

export const createSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { duration, distance_coverage } = req.body;


        const pricing = {
            base: {
                1: { price: 50, gems: 500 },
                2: { price: 90, gems: 900 },
                3: { price: 120, gems: 1200 },
            },
            extra: {
                1: { price: 10, gems: 100 },
                2: { price: 18, gems: 180 },
                3: { price: 25, gems: 250 },
            },
        };


        const total_gem = parseInt(pricing.base[duration].gems + (pricing.extra[distance_coverage]?.gems || 0) * duration);

        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business']
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        console.log('Current gem balance:', businessAccount.gem_balance);
        console.log('Total gems to spend:', total_gem);


        if (businessAccount.gem_balance < total_gem) {
            res.status(400).json({ status: 400, message: 'Not enough gems in the account' });
            return;
        }

        businessAccount.gem_balance -= total_gem;
        await businessAccount.save();


        const businessAccountSubscription = BusinessAccountSubscription.create({
            duration,
            distance_coverage,
            total_cost: pricing.base[duration].price + (pricing.extra[distance_coverage]?.price || 0) * duration,
            total_gem,
            title: `${duration} Month Plan`,
            description: `Subscription for ${duration} month(s) with ${distance_coverage} km coverage.`,
            business_register_business: businessAccount.business // Use the correct property name
        });

        await businessAccountSubscription.save();

        res.status(201).json(businessAccountSubscription);
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};


export const endSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;
        const { outlet_id } = req.body; // Assuming outlet_id is sent in the request body

        // Find the business account by username
        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business']
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        const business = businessAccount.business;

        // Find the subscription based on outlet_id and ensure it's active (not ended yet)
        const subscription = await BusinessAccountSubscription.findOne({
            where: {
                business_register_business: business,
                outlet: { outlet_id },
                status: "active" // Ensure subscription is still active
            }
        });

        if (!subscription) {
            res.status(404).json({ status: 404, message: 'Subscription not found or already ended' });
            return;
        }

        // Mark the subscription as ended (soft delete by setting the ended flag)
        subscription.status = "deleted";
        await subscription.save();

        res.status(200).json({ status: 200, message: 'Subscription ended successfully' });
    } catch (error) {
        console.error('Error ending subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};




export const createOutletSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, outletId } = req.params;
        const { duration, distance_coverage, total_cost, total_gem, title, description } = req.body;


        console.log('Incoming request data:', { username, outletId, duration, distance_coverage, total_cost, total_gem, title, description });


        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business']
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }


        const outlet = await Outlet.findOne({
            where: { outlet_id: parseInt(outletId, 10) }
        });

        if (!outlet) {
            res.status(404).json({ status: 404, message: 'Outlet not found' });
            return;
        }

        const business = businessAccount.business;

        const activationDate = new Date();


        let expirationDate = new Date(activationDate);
        expirationDate.setMonth(activationDate.getMonth() + duration);


        if (expirationDate.getDate() !== activationDate.getDate()) {

            expirationDate.setDate(0);
        }

        // Log dates for debugging
        console.log('Activation Date:', activationDate);
        console.log('Final Expiration Date:', expirationDate);



        const businessAccountSubscription = BusinessAccountSubscription.create({
            duration,
            distance_coverage,
            total_cost,
            total_gem,
            title,
            description,
            activation_date: activationDate,
            expiration_date: expirationDate,
            business_register_business: business,
            outlet: outlet
        });

        await businessAccountSubscription.save();


        const formattedActivationDate = activationDate.toLocaleDateString('en-US');
        const formattedExpirationDate = expirationDate.toLocaleDateString('en-US');

        res.status(201).json({
            message: 'Subscription created successfully',
            subscription: {
                duration,
                distance_coverage,
                total_cost,
                total_gem,
                title,
                description,
                activation_date: formattedActivationDate, // Send formatted date
                expiration_date: formattedExpirationDate, // Send formatted date
                business_register_business: business,
                outlet: outlet
            }
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};



export const checkExpiringSubscription = async (): Promise<void> => {

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const lastThreeDays = new Date();

    /*
    const oneWeekFromNow = new Date(); //assuming Now is current date before expiration
    const eightDaysFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    eightDaysFromNow.setDate(today.getDate() + 8); // Create a 1-day range for timezone differences
    */

    // Get the date exactly 7 days from now (time set to 00:00:00) to disregard the time and only compare by date. 
    const oneWeekFromNow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
    // Create a date for 8 days from now to provide a range (time set to 23:59:59 for the end of the day)
    const eightDaysFromNow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8);
    eightDaysFromNow.setHours(23, 59, 59, 999); // Set time to the end of the day

    //lastThreeDays.setDate(today.getDate() + 3);

    try {
        // Find subscriptions expiring within the next week
        const expiringSubscriptions = await BusinessAccountSubscription.find({
            where: {
                //expiration_date: Between(oneWeekFromNow, eightDaysFromNow), //1 week from expiry, only send once.
                expiration_date: Between(todayStart, oneWeekFromNow), // Check if expiration is within the 1-week range, continuosly send within the range 
                status: 'active' // Only send emails for active subscriptions
            },
            relations: ['business_register_business', 'business_register_business.business_account'] // Load related business for email
        });

        for (const subscription of expiringSubscriptions) {
            const business = subscription.business_register_business.business_account;
            //console.log("business:", business);
            //console.log("expiring subscription:", subscription.title);

            if (business && business.email) {
                // Send renewal email
                //console.log(`Sending renewal email to ${business.email}`);
                await sendSubscriptionRenewEmail(business.email);
                console.log(`Sent renewal email to ${business.email}`);
            }
        }
    } catch (error) {
        console.error("Error checking expiring subscriptions:", error);
    }
}

export const renewSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, outlet_id, duration, distance_coverage } = req.body;


        console.log('Request body:', req.body);


        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business']
        });


        if (!businessAccount) {
            console.log(`Business account with username "${username}" not found.`);
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        console.log('Found business account:', businessAccount);

        // Find the existing subscription by outlet ID (or main subscription)
        const existingSubscription = await BusinessAccountSubscription.findOne({
            where: {
                business_register_business: businessAccount.business,
                outlet: outlet_id || null // Match outlet_id or main subscription (null)
            },
            relations: ['business_register_business']
        });


        if (!existingSubscription) {
            console.log(`No existing subscription found for outlet_id: ${outlet_id} and business: ${businessAccount.business}`);
            res.status(404).json({ status: 404, message: 'No existing subscription found to renew' });
            return;
        }

        console.log('Found existing subscription:', existingSubscription);


        const currentDate = new Date();
        const newExpirationDate = new Date(currentDate);


        newExpirationDate.setMonth(currentDate.getMonth() + duration);


        existingSubscription.activation_date = currentDate;
        existingSubscription.expiration_date = newExpirationDate;
        existingSubscription.duration = duration;
        existingSubscription.distance_coverage = distance_coverage;


        await existingSubscription.save();


        console.log('Subscription successfully renewed:', existingSubscription);


        res.status(200).json({
            status: 200,
            message: 'Subscription successfully renewed',
            subscription: existingSubscription
        });
    } catch (error) {
        console.error('Error renewing subscription:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};


export const viewSubscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.params;

        const businessAccount = await Business_account.findOne({
            where: { username },
            relations: ['business']
        });

        if (!businessAccount) {
            res.status(404).json({ status: 404, message: 'Business account not found' });
            return;
        }

        const business = businessAccount.business;
        const subscriptions = await BusinessAccountSubscription.find({
            where: {
                business_register_business: business,
                status: 'active' // Only get active subscriptions
            },
            relations: ['outlet']
        });

        // Return an empty array if no active subscriptions are found, instead of a 404
        if (!subscriptions.length) {
            res.status(200).json({ status: 200, subscriptions: [] });
            return;
        }

        const formattedSubscriptions = subscriptions.map(subscription => ({
            ...subscription,
            outlet_id: subscription.outlet ? subscription.outlet.outlet_id : null,
        }));

        res.status(200).json({ status: 200, subscriptions: formattedSubscriptions });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
    }
};




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

export const editRegisterBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const username = (req as any).user.username;
        const updatedData = req.body; // Grab the updated data from the request body

        // Find the business account using the username
        const businessAccount = await Business_account.findOneBy({ username });
        if (!businessAccount) {
            res.status(404).json({ message: 'Business account not found' });
            return;
        }

        // Find the registered business associated with the business account
        const registeredBusiness = await Business_register_business.findOne({
            where: { business_account: businessAccount },
        });

        if (!registeredBusiness) {
            res.status(404).json({ message: 'Registered business not found' });
            return;
        }

        // Update the registered business fields based on the provided data
        if (updatedData.entityName) {
            registeredBusiness.entityName = updatedData.entityName;
        }
        if (updatedData.location) {
            registeredBusiness.location = updatedData.location;
        }
        if (updatedData.category) {
            registeredBusiness.category = updatedData.category;
        }

        // Save the updated registered business
        await registeredBusiness.save();

        res.status(200).json({
            message: 'Business registration updated successfully',
            registeredBusiness,
        });
    } catch (error) {
        console.error('Error updating business registration:', error);
        res.status(500).json({ message: 'Internal server error' });
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

export const retrieveOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { outlet_id } = req.params;

        const outletIdNum = parseInt(outlet_id, 10);
        if (isNaN(outletIdNum)) {
            res.status(400).json({ message: 'Invalid outlet_id' });
            return;
        }

        const outlet = await Outlet.findOne({ where: { outlet_id: outletIdNum } });
        if (!outlet) {
            res.status(404).json({ message: 'Outlet not found' });
            return;
        }

        res.status(200).json(outlet);
    } catch (error) {
        console.error('Error retrieving outlet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const editOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { outlet_id } = req.params;
        const updatedData = req.body; // Ensure you're sending the correct fields from the frontend
        console.log('EditOutlet - Updated data:', updatedData);
        const outletIdNum = parseInt(outlet_id, 10);
        if (isNaN(outletIdNum)) {
            res.status(400).json({ message: 'Invalid outlet_id' });
            return;
        }

        const outlet = await Outlet.findOne({ where: { outlet_id: outletIdNum } });
        if (!outlet) {
            res.status(404).json({ message: 'outlet not found' });
            return;
        }

        // Update voucher fields based on the provided data
        outlet.outlet_name = updatedData.name;
        outlet.location = updatedData.location;
        outlet.description = updatedData.description;
        outlet.contact = updatedData.contact;

        await outlet.save();

        res.status(200).json({ message: 'Outlet updated successfully', voucher: outlet });
    } catch (error) {
        console.error('Error updating outlet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}

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

export const createVoucher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, price, discount, business_id, outlet_id } = req.body;
        const username = (req as any).user.username;

        const businessAccount = await Business_account.findOne({ where: { username }, relations: ['business', 'outlets'] });
        if (!businessAccount) {
            res.status(404).json({ message: 'Business account not found' });
            return;
        }

        // Create a new voucher listing
        const newVoucher = Business_voucher.create({
            name,
            description,
            price,
            discount,
        });

        // If business_id is provided, associate with main business
        if (business_id) {
            const business = await Business_register_business.findOne({ where: { registration_id: business_id } });
            if (!business) {
                res.status(404).json({ message: 'Business not found' });
                return;
            }
            newVoucher.business_register_business = business;
        }

        // If outlet_id is provided, associate with outlet
        if (outlet_id) {
            const outlet = await Outlet.findOne({ where: { outlet_id } });
            if (!outlet) {
                res.status(404).json({ message: 'Outlet not found' });
                return;
            }
            newVoucher.outlet = outlet;
        }

        // Save the voucher
        await newVoucher.save();
        res.status(201).json({ message: 'Voucher created successfully', voucher: newVoucher });

    } catch (error) {
        console.error('Error creating voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllVoucher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registration_id, outlet_id } = req.query;
        //console.log('Received registration_id:', registration_id);
        //console.log('Received outlet_id:', outlet_id);
        let vouchers;

        if (registration_id) {
            // Fetch vouchers for the main business
            // Convert business_id to a number
            const registrationIdNum = parseInt(registration_id as string, 10);
            if (isNaN(registrationIdNum)) {
                res.status(400).json({ message: 'Invalid registration_id' });
                return;
            }

            const business = await Business_register_business.findOne({ where: { registration_id: registrationIdNum } });
            if (!business) {
                res.status(404).json({ message: 'Business not found' });
                return;
            }
            vouchers = await Business_voucher.find({
                where: { business_register_business: business, outlet: IsNull() },
                relations: ['business_register_business']
            });

        } else if (outlet_id) {
            // Fetch vouchers for the specific outlet
            // Convert outlet_id to a number
            const outletIdNum = parseInt(outlet_id as string, 10);
            if (isNaN(outletIdNum)) {
                res.status(400).json({ message: 'Invalid outlet_id' });
                return;
            }
            const outlet = await Outlet.findOne({ where: { outlet_id: outletIdNum } });
            if (!outlet) {
                res.status(404).json({ message: 'Outlet not found' });
                return;
            }
            vouchers = await Business_voucher.find({ where: { outlet: outlet }, relations: ['outlet'] });
        } else {
            res.status(400).json({ message: 'Please provide either business_id or outlet_id' });
            return;
        }

        // If no vouchers are found
        if (!vouchers || vouchers.length === 0) {
            res.status(404).json({ message: 'No vouchers found' });
            return;
        }

        // Respond with the vouchers
        res.status(200).json({ vouchers });
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const getVoucher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { listing_id } = req.params;
        console.log('Received listing_id:', listing_id);

        const voucherIdNum = parseInt(listing_id, 10);
        if (isNaN(voucherIdNum)) {
            res.status(400).json({ message: 'Invalid listing_id' });
            return;
        }

        const voucher = await Business_voucher.findOne({
            where: { listing_id: voucherIdNum },
            relations: ['business_register_business', 'outlet'],
        });

        if (!voucher) {
            res.status(404).json({ message: 'Voucher not found' });
            return;
        }

        res.status(200).json({ voucher });
    } catch (error) {
        console.error('Error fetching voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const editVoucher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { listing_id } = req.params;
        const updatedData = req.body; // Ensure you're sending the correct fields from the frontend

        const voucherIdNum = parseInt(listing_id, 10);
        if (isNaN(voucherIdNum)) {
            res.status(400).json({ message: 'Invalid listing_id' });
            return;
        }

        const voucher = await Business_voucher.findOne({ where: { listing_id: voucherIdNum } });
        if (!voucher) {
            res.status(404).json({ message: 'Voucher not found' });
            return;
        }

        // Update voucher fields based on the provided data
        voucher.name = updatedData.name;
        voucher.description = updatedData.description;
        voucher.price = updatedData.price;
        voucher.discount = updatedData.discount;
        voucher.voucherImage = updatedData.voucherImage;

        await voucher.save();

        res.status(200).json({ message: 'Voucher updated successfully', voucher });
    } catch (error) {
        console.error('Error updating voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const deleteVoucher = async (req: Request, res: Response): Promise<void> => {
    try {
        const { listing_id } = req.params;

        const voucherIdNum = parseInt(listing_id, 10);
        if (isNaN(voucherIdNum)) {
            res.status(400).json({ message: 'Invalid listing_id' });
            return;
        }

        // Find the voucher by listing_id
        const voucher = await Business_voucher.findOne({ where: { listing_id: voucherIdNum } });
        if (!voucher) {
            res.status(404).json({ message: 'Voucher not found' });
            return;
        }

        // Delete the voucher
        await voucher.remove();

        res.status(200).json({ message: 'Voucher deleted successfully' });
    } catch (error) {
        console.error('Error deleting voucher:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const searchVouchers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registration_id, outlet_id, searchTerm } = req.query;

        let vouchers;
        const query = Business_voucher.createQueryBuilder('voucher');

        if (searchTerm) {
            query.andWhere('(voucher.name ILIKE :search OR voucher.description ILIKE :search)', {
                search: `%${searchTerm}%`
            });
        }

        if (registration_id) {
            query.andWhere('voucher.business_register_business = :registration_id', { registration_id });
        }

        if (outlet_id) {
            query.andWhere('voucher.outlet = :outlet_id', { outlet_id });
        }

        vouchers = await query.getMany();

        if (vouchers.length === 0) {
            res.status(404).json({ message: 'No vouchers found' });
            return;
        }

        res.status(200).json({ vouchers });
        return;
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
    }
};

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

export const topUpGemsBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            currency_cents: currencyCents,
            gems_added: gemsAdded,
        } = req.body;

        if (!currencyCents || currencyCents <= 0) {
            res.status(400).json({ message: 'Invalid currency amount' });
        }

        if (!gemsAdded || gemsAdded <= 0) {
            res.status(400).json({ message: 'Invalid gem amount' });
        }

        const userId = (req as any).user.id;  // Get user from JWT token
        const businessAccount = await Business_account.findOne({ where: { business_id: userId } });

        if (!businessAccount) {
            res.status(404).json({ message: 'Account not found' });
        } else {
            // Add the top-up amount to the existing balance
            const currentGemBalance = parseFloat(businessAccount.gem_balance.toString());
            const newGemBalance = currentGemBalance + gemsAdded;

            // Update the balance and save
            businessAccount.gem_balance = parseFloat(newGemBalance.toFixed(2));
            await businessAccount.save();

            const currencyDollars = currencyCents / 100;  // Convert cents to dollars

            const businessTransaction = Business_transaction.create({
                currency_amount: currencyDollars,
                gems_added: gemsAdded,
                business_account: businessAccount
            });
            await businessTransaction.save();

            // Respond with the updated balance
            res.status(200).json({ message: 'Gems topped up successfully', balance: businessAccount.gem_balance });
        }
    } catch (error) {
        console.error('Error topping up gems:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
