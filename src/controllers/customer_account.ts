import { Request, Response } from "express";
import { Customer_account } from "../entities/Customer_account";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Avatar } from "../entities/Avatar";
import { Customer_transaction } from "../entities/Customer_transaction";
import { generateOTP, sendOTPEmail } from '../utils/otp';


// Function to calculate total XP required to reach a certain level
function calculateTotalXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor((100 * (Math.pow(1.5, level - 1) - 1)) / (1.5 - 1));
}

// Function to calculate the player's current level based on total XP
function calculateLevel(exp: number): number {
    return (
        Math.floor(Math.log((exp * (1.5 - 1)) / 100 + 1) / Math.log(1.5)) + 1
    );
}

// For calculating progress in front end
function calculateXpForNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

export const registerCustomer = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { fullName, username, email, password } = req.body;

        // Check if username or email is already in use
        const existingUser = await Customer_account.findOne({
            where: [{ username }, { email }],
        });

        if (existingUser) {
            res.status(400).json({
                status: 400,
                message:
                    existingUser.username === username
                        ? "Username already in use"
                        : "Email already in use",
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP and expiration time
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);  // Hash OTP for security
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);  // OTP valid for 10 minutes

        const customer_account = Customer_account.create({
            fullName,
            username,
            email,
            password: hashedPassword,
            exp: 0,
            otp: hashedOTP,
            otpExpiresAt
        });

        await customer_account.save();

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        // Send OTP to the user's email
        await sendOTPEmail(email, otp);

        const token = jwt.sign(
            {
                id: customer_account.id,
                username: customer_account.username,
                role: customer_account.role,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        res.json({
            customer_account,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 400,
            message: error.message,
        });
    }
};


export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {

        const { otp, userId } = req.body;

        const customerAccount = await Customer_account.findOne({ where: { id: userId } });

        if (!customerAccount) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        // Check if the OTP is expired
        if (customerAccount.otpExpiresAt && customerAccount.otpExpiresAt < new Date()) {
            res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
            return;
        }

        // Verify the OTP
        const isOTPValid = await bcrypt.compare(otp, customerAccount.otp);
        if (!isOTPValid) {
            res.status(400).json({ message: 'Invalid OTP' });
            return;
        }

        // Clear the OTP and mark account as verified
        customerAccount.otp = "";
        customerAccount.otpExpiresAt = null;

        await customerAccount.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;
        const customerAccount = await Customer_account.findOne({ where: { id: userId } });

        if (!customerAccount) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        // Generate a new OTP
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Update the account with new OTP
        customerAccount.otp = hashedOTP;
        customerAccount.otpExpiresAt = otpExpiresAt;

        await customerAccount.save();

        // Send the OTP to the user's email
        await sendOTPEmail(customerAccount.email, otp);

        res.status(200).json({ message: 'A new OTP has been sent to your email.' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};




export const loginCustomer = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { login, password } = req.body;

        // Check if login is username or email
        const customer_account = await Customer_account.findOne({
            where: [{ username: login }, { email: login }],
        });

        if (!customer_account) {
            res.status(401).json({
                status: 401,
                message: "Invalid credentials",
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            customer_account.password
        );

        if (!isPasswordValid) {
            res.status(401).json({
                status: 401,
                message: "Invalid credentials",
            });
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }

        const isEmailVerified = !customer_account.otp; // If OTP is null or empty, the email is verified

        const token = jwt.sign(
            {
                id: customer_account.id,
                username: customer_account.username,
                role: customer_account.role,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: "1h" }
        );

        res.json({
            customer_account,
            token,
            isEmailVerified,//send the verification status to frontend.
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            status: 400,
            message: error.message,
        });
    }
};

export const getUserInfo = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const customer_account = await Customer_account.findOne({
            where: { id: userId },
            select: ["id", "fullName", "username", "email", "exp"],
        });

        if (!customer_account) {
            res.status(404).json({
                status: 404,
                message: "User not found",
            });
            return;
        }

        const currentLevel = calculateLevel(customer_account.exp);
        //Total xp required to reach current level
        const xpForCurrentLevel = calculateTotalXpForLevel(currentLevel);
        // Xp required between current level and next level
        const xpForNextLevel =
            calculateTotalXpForLevel(currentLevel + 1) - xpForCurrentLevel;

        res.json({
            ...customer_account,
            currentLevel,
            xpForNextLevel,
            xpProgress: customer_account.exp - xpForCurrentLevel,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};

export const editProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { fullName, username, email } = req.body;

        const customer_account = await Customer_account.findOne({
            where: { id: userId },
        });

        if (!customer_account) {
            res.status(404).json({
                status: 404,
                message: "User not found",
            });
            return;
        }

        if (username && username !== customer_account.username) {
            const existingUsername = await Customer_account.findOne({
                where: { username },
            });
            if (existingUsername) {
                res.status(400).json({
                    status: 400,
                    message: "Username already in use",
                });
                return;
            }
            customer_account.username = username;
        }

        if (email && email !== customer_account.email) {
            const existingEmail = await Customer_account.findOne({
                where: { email },
            });
            if (existingEmail) {
                res.status(400).json({
                    status: 400,
                    message: "Email already in use",
                });
                return;
            }
            customer_account.email = email;
        }

        if (fullName) {
            customer_account.fullName = fullName;
        }

        await customer_account.save();

        res.json({
            status: 200,
            message: "Profile updated successfully",
            customer_account,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};

export const deleteAccount = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const customer_account = await Customer_account.findOne({
            where: { id: userId },
        });

        if (!customer_account) {
            res.status(404).json({
                status: 404,
                message: "User not found",
            });
            return;
        }

        await customer_account.remove();

        res.json({
            status: 200,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};

export const changePassword = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { currentPassword, newPassword } = req.body;

        const customer_account = await Customer_account.findOne({
            where: { id: userId },
        });

        if (!customer_account) {
            res.status(404).json({
                status: 404,
                message: "User not found",
            });
            return;
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            customer_account.password
        );

        if (!isPasswordValid) {
            res.status(401).json({
                status: 401,
                message: "Current password is incorrect",
            });
            return;
        }

        // Hash and set new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        customer_account.password = hashedNewPassword;

        await customer_account.save();

        res.json({
            status: 200,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};

export const updateCustomerAvatar = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { avatarId } = req.body;

        const customer_account = await Customer_account.findOne({
            where: { id: userId },
        });

        if (!customer_account) {
            res.status(404).json({
                status: 404,
                message: "User not found",
            });
            return;
        }

        const avatar = await Avatar.findOne({ where: { id: avatarId } });

        if (!avatar) {
            res.status(404).json({
                status: 404,
                message: "Avatar not found",
            });
            return;
        }

        customer_account.avatar = avatar;
        await customer_account.save();

        res.status(200).json({
            status: 200,
            message: "Customer avatar updated successfully",
        });
    } catch (error) {
        console.error("Error updating customer avatar:", error);
        res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};

export const topUpGemsCustomer = async (req: Request, res: Response): Promise<void> => {
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

        const userId = (req as any).user.id;
        const customerAccount = await Customer_account.findOne({ where: { id: userId } });

        if (!customerAccount) {
            res.status(404).json({ message: "User not found" });
        } else {
            // Add the top-up amount to the existing balance
            const currentGemBalance = parseFloat(customerAccount.gem_balance.toString());
            const newGemBalance = currentGemBalance + gemsAdded;

            // Update the balance and save
            customerAccount.gem_balance = parseFloat(newGemBalance.toFixed(2));
            await customerAccount.save();

            const currencyDollars = currencyCents / 100;  // Convert cents to dollars

            const customerTransaction = Customer_transaction.create({
                currency_amount: currencyDollars,
                gems_added: gemsAdded,
                customer_account: customerAccount
            });
            await customerTransaction.save();

            // Respond with the updated balance
            res.status(200).json({ message: 'Gems topped up successfully', balance: customerAccount.gem_balance });
        }
    } catch (error) {
        console.error('Error topping up gems:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
