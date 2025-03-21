import { Request, Response } from "express";
import { Customer_account } from "../entities/customerAccount.entity";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Avatar } from "../entities/avatar.entity";
import { Customer_transaction } from "../entities/customerTransaction.entity";
import { BusinessAccountSubscription } from '../entities/businessAccountSubscription.entity';
import { generateOTP, sendOTPEmail } from '../utils/otp';
import { stripe } from "../index";
import { Customer_inventory } from "../entities/customerInventory.entity";
import { Business_voucher } from "../entities/businessVoucher.entity";
import { Voucher_transaction } from "../entities/voucherTransaction.entity";
import { Customer_group_purchase } from "../entities/customerGroupPurchase.entity";
import { Customer_group_participant } from "../entities/customerGroupParticipant.entity";
import { MoreThan } from "typeorm";
import { Streak } from "../entities/Streak";



export const startGroupPurchase = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { voucher_id, group_size, expires_at } = req.body;
    // Log the inputs for debugging
    console.log('Received userId:', userId);
    console.log('Received voucher_id:', voucher_id);
    try {
        const voucher = await Business_voucher.findOne({
            where: { listing_id: voucher_id },
        });
        //const creator = await Customer_account.findOne(userId);
        const creator = await Customer_account.findOne({
            where: { id: userId },
        });
        console.warn(req.body.expires_at);


        if (!voucher || !creator) {
            return res.status(404).json({ message: "Voucher or creator not found" });
        }

        const groupPurchase = Customer_group_purchase.create({
            voucher,
            creator,
            group_size,
            current_size: 1, // Creator counts as the first member
            groupStatus: "pending",
            expires_at,
        });

        await groupPurchase.save();

        // Add the creator as the first participant
        const participant = Customer_group_participant.create({
            groupPurchase,
            customer: creator,
            joined_at: new Date(),
        });
        await participant.save();

        return res.status(201).json(groupPurchase);
    } catch (error) {
        console.error("Backend Error:", error); // Log the specific error
        return res.status(500).json({ message: "Error starting group purchase", error: error.message });
    }
};

{/*
export const joinGroupPurchase = async (req: Request, res: Response) => {
    const { group_purchase_id } = req.body;
    const customer_id = (req as any).user.id;

    try {
        const groupPurchase = await Customer_group_purchase.findOne({
            where: { id: group_purchase_id },
            relations: ["participants"],
        });

        const customer = await Customer_account.findOne({
            where: { id: customer_id },
        });

        if (!groupPurchase || !customer) {
            return res.status(404).json({ message: "Group purchase or customer not found" });
        }

        // Check if the group is full or expired
        if (groupPurchase.current_size >= groupPurchase.group_size) {
            return res.status(400).json({ message: "Group purchase is already complete" });
        }

        if (new Date() > groupPurchase.expires_at) {
            return res.status(400).json({ message: "Group purchase has expired" });
        }

        // Add the new participant
        const participant = Customer_group_participant.create({
            groupPurchase,  // Ensure this field is properly set
            customer,
            joined_at: new Date(),
        });

        await participant.save();

        // Update the group size
        groupPurchase.current_size += 1;

        // If the group is complete, update the status
        if (groupPurchase.current_size === groupPurchase.group_size) {
            groupPurchase.status = "complete";
        }

        await groupPurchase.save();

        return res.status(200).json(groupPurchase);
    } catch (error) {
        return res.status(500).json({ message: "Error joining group purchase", error: error.message });
    }
};
*/}

export const joinGroupPurchase = async (req: Request, res: Response) => {
    const { group_purchase_id } = req.body;
    console.log("group_purchase_id", group_purchase_id);
    const customer_id = (req as any).user.id;

    try {
        const groupPurchase = await Customer_group_purchase.findOne({
            where: { id: group_purchase_id },
            relations: ["participants", "participants.customer"],
        });
        //console.log("groupPurchase in join:", groupPurchase);

        const customer = await Customer_account.findOne({
            where: { id: customer_id },
        });

        if (!groupPurchase || !customer) {
            return res.status(404).json({ message: "Group purchase or customer not found" });
        }

        // Check if the group is full or expired
        if (groupPurchase.current_size >= groupPurchase.group_size) {
            return res.status(400).json({ message: "Group purchase is already complete" });
        }
        if (new Date() > groupPurchase.expires_at) {
            return res.status(400).json({ message: "Group purchase has expired" });
        }

        // Check if the customer has already joined this group purchase
        const existingParticipant = groupPurchase.participants.find(participant => participant.customer.id === customer.id);
        if (existingParticipant) {
            return res.status(400).json({ message: "Customer has already joined this group purchase." });
        }

        // Add the new participant
        const participant = Customer_group_participant.create({
            //groupPurchase: { id: group_purchase_id },
            groupPurchase: groupPurchase,
            customer: customer,
            joined_at: new Date(),
            payment_status: "pending",

        });
        await participant.save();


        groupPurchase.current_size += 1;  // Updat group size

        if (groupPurchase.current_size === groupPurchase.group_size) {
            groupPurchase.groupStatus = "completed"; //group full
        }
        groupPurchase.participants.push(participant); // Add the new participant to the group purchase
        await groupPurchase.save();

        // Reload the groupPurchase entity to include the newly added participant
        const updatedGroupPurchase = await Customer_group_purchase.findOne({
            where: { id: group_purchase_id },
            relations: ["participants", "participants.customer"],
        });
        if (updatedGroupPurchase) {
            console.log("Participants in the updated group purchase:", updatedGroupPurchase.participants);
        } else {
            console.log("Failed to reload the updated group purchase.");
        }

        console.log("updatedGroupPurchase in join", updatedGroupPurchase);
        //console.log("returning group purchase", groupPurchase);
        return res.status(200).json(updatedGroupPurchase);
    } catch (error) {
        console.error("Error in joinGroupPurchase:", error.message);
        return res.status(500).json({ message: "Error joining group purchase", error: error.message });
    }
};

export const getGroupPurchaseStatus = async (req: Request, res: Response) => {
    const { group_purchase_id } = req.params;

    try {
        const groupPurchase = await Customer_group_purchase.findOne({
            where: { id: Number(group_purchase_id) },
            relations: ["voucher", "participants", "creator"],
        });

        if (!groupPurchase) {
            return res.status(404).json({ message: "Group purchase not found" });
        }

        return res.status(200).json(groupPurchase);
    } catch (error) {
        return res.status(500).json({ message: "Error fetching group purchase status", error });
    }
};

export const getAllCreatedGroups = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        // Fetch the customer account with their owned group purchases
        const customer = await Customer_account.findOne({
            where: { id: userId },
            relations: ["ownedGroupPurchases", "ownedGroupPurchases.voucher", "ownedGroupPurchases.participants"]
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Extract and return the owned group purchases
        const groupPurchases = customer.ownedGroupPurchases;

        return res.status(200).json({
            groupPurchases,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching created groups", error });
    }
};

export const getAllJoinedGroups = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        // Fetch the customer account with their joined group purchases
        const customer = await Customer_account.findOne({
            where: { id: userId },
            relations: ["participants", "participants.groupPurchase", "participants.groupPurchase.voucher"]
        });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Extract and return the joined group purchases, loop that takes in participant obj and return groupPurcahse of particpant
        const joinedGroupPurchases = customer.participants.map(participant => participant.groupPurchase);

        return res.status(200).json({
            joinedGroupPurchases,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching joined groups", error });
    }
};


export const cancelGroupPurchaseStatus = async (req: Request, res: Response) => {
    const { group_purchase_id, creator_id } = req.body;

    try {
        // Fetch the group purchase
        const groupPurchase = await Customer_group_purchase.findOne({
            where: { id: Number(group_purchase_id) },
            relations: ["creator"],
        });

        if (!groupPurchase) {
            return res.status(404).json({ message: "Group purchase not found." });
        }

        // Ensure only the creator can cancel it and it's still pending
        if (groupPurchase.creator.id !== creator_id || groupPurchase.groupStatus !== "pending") {
            return res.status(403).json({ message: "You can only cancel a pending group purchase as the creator." });
        }

        // Mark the group purchase as canceled
        groupPurchase.groupStatus = "canceled";
        await groupPurchase.save();

        return res.status(200).json({ message: "Group purchase canceled successfully." });

    } catch (error) {
        console.error("Error canceling group purchase:", error);
        return res.status(500).json({ message: "Error canceling group purchase" });
    }
};

// TEMPORARY Endpoint to get all available vouchers for customers
export const getAllVouchersForCustomers = async (req: Request, res: Response) => {
    try {
        // Optional: Add filtering logic such as only fetching active or non-expired vouchers
        const vouchers = await Business_voucher.find({
            relations: ['business_register_business', 'outlet'], // Include business and outlet relations if needed
            where: {
                // You can add any filter conditions here (e.g., expiration date)
                expirationDate: MoreThan(new Date()) // Only show non-expired vouchers
            }
        });

        if (!vouchers || vouchers.length === 0) {
            return res.status(404).json({ message: 'No vouchers found' });
        }

        return res.status(200).json({ vouchers });
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const updateVoucherTransactionStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { transactionId } = req.params; // Get the transactionId from the route params

        // Convert transactionId to number for validation
        const transactionIdNum = parseInt(transactionId, 10);
        if (isNaN(transactionIdNum)) {
            res.status(400).json({ message: 'Invalid transaction ID' });
            return;
        }

        // Find the transaction by ID
        const transaction = await Voucher_transaction.findOne({ where: { id: transactionIdNum } });

        if (!transaction) {
            res.status(404).json({ message: 'Voucher transaction not found' });
            return;
        }

        // Check if the voucher has already been used
        if (transaction.used) {
            res.status(400).json({ message: 'Voucher transaction already used' });
            return;
        }

        // Update the "used" status to true
        transaction.used = true;
        await transaction.save();

        // Respond with the updated transaction
        res.status(200).json({
            message: 'Voucher transaction status updated successfully',
            transaction: {
                id: transaction.id,
                used: transaction.used,
                customerId: transaction.customerId,
                voucherId: transaction.voucherId,
            }
        });
    } catch (error) {
        console.error('Error updating voucher transaction status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
{/* 
export const redeemVoucherTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { transactionId } = req.params;

        const transactionIdNum = parseInt(transactionId, 10);
        if (isNaN(transactionIdNum)) {
            res.status(400).json({ message: 'Invalid transaction_id' });
            return;
        }

        const transaction = await Voucher_transaction.findOne({
            where: { id: transactionIdNum },
            relations: ['voucher'],
        });

        if (!transaction) {
            res.status(404).json({ message: 'Voucher transaction not found' });
            return;
        }


        if (transaction.redeemed) {
            res.status(400).json({ message: 'Voucher transaction already redeemed' });
            return;
        }


        transaction.redeemed = true;
        await transaction.save();


        res.status(200).json({
            id: transaction.id,
            voucherId: transaction.voucher.listing_id,
            voucher_transaction_id: transaction.id,
            voucherName: transaction.voucher.name,
            customerId: transaction.customerId,
            redeemed: transaction.redeemed,
            purchaseDate: transaction.purchaseDate.toISOString(),
            expirationDate: transaction.voucher.expirationDate.toISOString(),
        });
    } catch (error) {
        console.error('Error redeeming voucher transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const purchaseVoucher = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { voucherId } = req.body;

    try {
        // Fetch the voucher by listing_id
        const voucher = await Business_voucher.findOne({
            where: { listing_id: voucherId },
            relations: ['business_register_business', 'outlet']
        });

        if (!voucher) {
            res.status(404).json({ message: "Voucher not found" });
            return;
        }

        // Calculate the discounted price
        const discountedPrice = voucher.price - (voucher.price * (voucher.discount / 100));
        const conversionRate = 10;
        const discountedPriceInGems = Math.round(discountedPrice * conversionRate);

        // Fetch the customer account
        const customer = await Customer_account.findOne({ where: { id: userId } });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        // Check if the customer has enough gems
        if (customer.gem_balance < discountedPriceInGems) {
            res.status(400).json({ message: "Insufficient gem balance" });
            return;
        }

        // Deduct gems from the customer's balance
        customer.gem_balance -= discountedPriceInGems;
        await customer.save();

        // Fetch or create the customer's inventory
        let inventory = await Customer_inventory.findOne({
            where: { customer_account: { id: userId } },
            relations: ['vouchers'],
        });

        if (!inventory) {
            inventory = new Customer_inventory();
            inventory.customer_account = customer;
            await inventory.save(); // Save the inventory first
        }

        // Ensure the voucher relationship is set up properly
        if (!inventory.vouchers.includes(voucher)) {
            inventory.vouchers.push(voucher);
            await inventory.save(); // Save the updated inventory with the new voucher
        }

        // Create a voucher transaction record
        const transaction = new Voucher_transaction();
        transaction.voucher = voucher;
        transaction.gems_spent = discountedPriceInGems;
        transaction.customerId = userId;
        transaction.redeemed = false;
        transaction.purchaseDate = new Date();
        await transaction.save();

        // Return a success response
        res.status(201).json({
            message: "Voucher purchased successfully",
            voucher: {
                listing_id: voucher.listing_id,
                name: voucher.name,
                description: voucher.description,
                original_price: voucher.price,
                discount: voucher.discount,
                discounted_price: discountedPrice,
                discounted_price_in_gems: discountedPriceInGems,
                duration: voucher.duration,
                voucher_transaction_id: transaction.id,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getVoucherInventory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const customerAccount = await Customer_account.findOne({
            where: { id: userId },
            relations: ["customer_inventory", "customer_inventory.vouchers"], // Ensure vouchers are loaded
        });

        console.log('Fetched Customer Account:', JSON.stringify(customerAccount, null, 2));

        if (!customerAccount || !customerAccount.customer_inventory) {
            res.status(404).json({ status: 404, message: "User or inventory not found" });
            return;
        }

        const inventory = customerAccount.customer_inventory;
        console.log('Fetched Inventory:', JSON.stringify(inventory, null, 2));

        if (!inventory.vouchers || inventory.vouchers.length === 0) {
            res.status(404).json({ status: 404, message: "No vouchers found in inventory" });
            return;
        }

        // Fetch voucher transactions to determine if any are redeemed
        const voucherTransactions = await Voucher_transaction.find({
            where: { customerId: userId },
            relations: ['voucher'], // Include voucher details if needed
        });

        const vouchersWithTransactions = inventory.vouchers.map(voucher => {
            const transaction = voucherTransactions.find(t => t.voucher.listing_id === voucher.listing_id);
            return {
                ...voucher,
                voucher_transaction_id: transaction ? transaction.id : null, // Assign the transaction ID or null if not found
                redeemed: transaction ? transaction.redeemed : false, // Ensure 'redeemed' reflects the actual transaction state
            };
        });


        res.json({
            status: 200,
            vouchers: vouchersWithTransactions,
            inventoryUsed: inventory.used,
        });
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

*/}



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

function generateUniqueReferralCode(): string{
    return Math.random().toString(36).substring(2, 10).toUpperCase(); 
}

export const registerCustomer = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { fullName, username, email, password, referral_code } = req.body;

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
        const newReferralCode = generateUniqueReferralCode()

        const customer_account = Customer_account.create({
            fullName,
            username,
            email,
            password: hashedPassword,
            exp: 0,
            otp: hashedOTP,
            otpExpiresAt,
            referral_code: newReferralCode,
        });


        //if used friend's referral code, free 50 gems upon sign up for both accounts
        if (referral_code){
            const friend = await Customer_account.findOne({
                where: { referral_code },
                relations: ["friends"]
            });
        
            if(friend){
                await customer_account.save();

                const newUser = await Customer_account.findOne({
                    where: { username },
                    relations: ["friends"]
                })

                if(newUser){
                    newUser.gem_balance += 50
                    newUser.friends.push(friend)
                    await newUser.save();

                    friend.gem_balance += 50
                    friend.code_used += 1
                    friend.friends.push(newUser)
    
                    await friend.save();
                }

                    } else {
                        console.log("Invalid referral code")
                        res.status(404).json({
                            status: 404,
                            message: "Invalid referral code"
                        });
                        return;
                    }
        
        } else {
            await customer_account.save();
        }

        const customer_inventory = Customer_inventory.create({
            customer_account, // Link the inventory to the customer account
        });

        await customer_inventory.save();

        const streak = Streak.create({
            streakCount: 1,
            maxStreakCount: 1,
            lastCheckIn: null as Date | null,  // Explicitly set `null` for lastCheckIn
            xpReward: 0,
            customer: customer_account, // Corrected to `customer`
        });

        await streak.save();

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




const updateStreak = async (customerId: number) => {
    // Fetch the customer's account and streak information from the database
    const query = Customer_account.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.streak', 'streak')
        .where('customer.id = :id', { id: customerId });

    console.log(query.getQuery()); // Log the query for debugging
    const customer = await query.getOne();

    if (!customer) {
        throw new Error('Customer not found');
    }


    // Ensure `customer.exp` is initialized to avoid undefined behavior
    customer.exp = customer.exp ?? 0;

    const today = new Date();
    const lastLoginDate = customer.lastLogin ? new Date(customer.lastLogin) : null;

    // Initialize the new streak count and XP reward
    let newStreakCount = customer.streak?.streakCount || 0;
    let xpReward = 0; // Start with 0 XP reward by default

    if (!lastLoginDate) {
        // If there's no last login, initialize streak and set initial XP
        newStreakCount = 1;
        xpReward = 10; // Initial XP for the first login
    } else {
        const lastLoginDateString = lastLoginDate.toISOString().split('T')[0];
        const todayString = today.toISOString().split('T')[0];

        if (lastLoginDateString !== todayString) {
            const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day login: increase streak and XP
                newStreakCount += 1;
                xpReward = Math.min(newStreakCount * 10, 50);
                if (newStreakCount > customer.streak.maxStreakCount) {
                    customer.streak.maxStreakCount = newStreakCount; // Update max streak count
                }
            } else {
                // Non-consecutive login: reset streak to 1 and set XP to 10
                newStreakCount = 1;
                xpReward = 10;
            }
        } else {
            // If already logged in today, return without modifying `exp`
            return {
                streakCount: newStreakCount,
                lastLogin: lastLoginDate.toISOString(),
                xpReward: 0, // No XP reward for multiple logins on the same day
            };
        }
    }

    // Accumulate XP only if there's an XP reward to be added
    if (xpReward > 0) {
        customer.exp += xpReward;
        customer.lastLogin = today; // Update lastLogin to today's date after rewarding XP
        await customer.save(); // Save the updated customer account with new XP
    }

    // Update the streak entity only if streak has changed
    if (customer.streak) {
        console.log("Updating streak for customer:", customerId);
        customer.streak.lastCheckIn = today;
        customer.streak.streakCount = newStreakCount;
        await customer.streak.save(); // Save the updated streak
        console.log("Streak updated:", {
            lastCheckIn: customer.streak.lastCheckIn,
            streakCount: customer.streak.streakCount,
        });
    }

    return {
        streakCount: newStreakCount,
        maxStreakCount: customer.streak.maxStreakCount,
        lastLogin: today.toISOString(),
        xpReward: xpReward, // Return the XP rewarded for this login
    };
};

export default updateStreak; // Export the function for use in other parts of your application



export const repairStreak = async (req: Request, res: Response): Promise<Response<any>> => {
    const userId = (req as any).user.id;

    try {
        const customer = await Customer_account.findOne({
            where: { id: userId },
            select: ["id", "fullName", "username", "email", "exp", "gem_balance"],
            relations: ["streak"],
        });

        if (!customer || !customer.streak) {
            return res.status(404).json({ error: "Customer or streak data not found." });
        }

        // Check if the streak is broken
        if (customer.streak.streakCount > 1) {
            return res.status(400).json({ error: "Your streak is still active. No repair needed." });
        }

        const baseCost = 10; // Base gem cost for streak repair
        const gemsRequired = baseCost * customer.streak.maxStreakCount; // Cost scales with max streak count

        if (customer.gem_balance < gemsRequired) {
            return res.status(400).json({ error: "Insufficient gems to repair streak." });
        }

        // Deduct gems and restore streak
        customer.gem_balance -= gemsRequired;
        customer.streak.streakCount = customer.streak.maxStreakCount; // Restore to max streak count
        await customer.save();
        await customer.streak.save();

        // Send the response back to the client
        return res.status(200).json({
            message: "Streak restored successfully.",
            gem_balance: customer.gem_balance,
            streakCount: customer.streak.streakCount,
            gemsRequired,
        });

    } catch (error) {
        // Handle unexpected errors
        console.error(error); // Log the error for debugging
        return res.status(500).json({ error: "An unexpected error occurred while repairing the streak." });
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

        const streakData = await updateStreak(customer_account.id); // Call the streak update function
        console.log("Streak Data after update:", streakData); // Debugging log

        customer_account.lastLogin = new Date();

        if (streakData.xpReward > 0) {
            customer_account.exp += streakData.xpReward;
        }

        await customer_account.save(); // Save the updated last login date and exp


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
            streakCount: streakData.streakCount, // include streak count in the response
            maxStreakCount: customer_account.streak.maxStreakCount, // Add max streak count
            lastCheckIn: streakData.lastLogin, // include last check-in date in the response

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
            select: ["id", "fullName", "username", "email", "exp", "gem_balance", "code_used", "referral_code"],
            relations: ["streak"],
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

        const streakCount = customer_account.streak?.streakCount || 0; // Default to 0 if no streak
        const lastCheckIn = customer_account.streak?.lastCheckIn || null; // Default to null if no check-in
        console.log(streakCount);
        console.log("check" + lastCheckIn);
        res.json({
            ...customer_account,
            currentLevel,
            xpForNextLevel,
            xpProgress: customer_account.exp - xpForCurrentLevel,
            streakCount, // Include streak count
            lastCheckIn, // Include last check-in date
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
        const { password } = req.body;

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

        // Verify password
        const isPasswordValid = await bcrypt.compare(
            password,
            customer_account.password
        );

        if (!isPasswordValid) {
            res.status(401).json({
                status: 401,
                message: "Invalid password",
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

export const verifyTopUpCustomer = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            paymentIntentId,
            gemsAdded,
        } = req.body;

        if (!paymentIntentId || !gemsAdded || gemsAdded <= 0) {
            res.status(400).json({ success: false, message: 'Invalid request parameters' });
            return;
        }

        // Retrieve the PaymentIntent from Stripe to verify payment status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            res.status(400).json({ success: false, message: 'Payment not completed or failed' });
            return;
        }

        // Retrieve user from JWT token
        const userId = (req as any).user.id;
        const customerAccount = await Customer_account.findOne({ where: { id: userId } });

        if (!customerAccount) {
            res.status(404).json({ success: false, message: 'Account not found' });
            return;
        }

        // Check if this payment intent has already been processed
        const transactionExists = await Customer_transaction.findOne({ where: { stripe_payment_intent_id: paymentIntentId } });
        if (transactionExists) {
            res.status(400).json({ success: false, message: 'This payment has already been processed.' });
            return;
        }

        // Add the gems to the customer account balance
        const currentGemBalance = parseFloat(customerAccount.gem_balance.toString());
        const newGemBalance = currentGemBalance + gemsAdded;

        // Update the balance and save
        customerAccount.gem_balance = parseFloat(newGemBalance.toFixed(2));
        await customerAccount.save();

        // Log the transaction in the customer transaction table
        const currencyDollars = paymentIntent.amount_received / 100; // Stripe provides amount in cents
        const customerTransaction = Customer_transaction.create({
            currency_amount: currencyDollars,
            gems_added: gemsAdded,
            customer_account: customerAccount,
            stripe_payment_intent_id: paymentIntent.id  // Store PaymentIntent ID to ensure idempotency
        });
        await customerTransaction.save();

        // Respond with the updated balance
        res.status(200).json({ success: true, message: 'Gems topped up successfully', balance: customerAccount.gem_balance });
        return;

    } catch (error) {
        console.error('Error verifying payment and topping up gems:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const getAllValidSubscription = async (req: Request, res: Response) => {
    try {
        // Fetch subscriptions with status 'active'
        const activeSubscriptions = await BusinessAccountSubscription.find({
            where: {
                status: "active",
            },
            relations: ['business_register_business', 'business_register_business.avatar', 'outlet', 'outlet.avatar'], // Include related business, outlet, and avatars
        });

        if (activeSubscriptions.length === 0) {
            return res.status(404).json({ message: 'No active subscriptions found' });
        }

        const subscriptionsWithValidBanStatus = activeSubscriptions.filter(subscription => {
            const isOutlet = !!subscription.outlet;

            if (isOutlet) {
                const outletBanStatus = subscription.outlet?.banStatus;
                return outletBanStatus === false
            } else {
                const businessBanStatus = subscription.business_register_business?.banStatus;
                return businessBanStatus === false
            }
        });

        // Map the subscriptions to include the business or outlet details and avatar information
        const subscriptionsWithAvatars = subscriptionsWithValidBanStatus.map((subscription) => {
            // Check if the subscription is for an outlet
            const isOutlet = !!subscription.outlet;

            // If it's an outlet, fetch the outlet's avatar; otherwise, fetch the business avatar
            const avatar = isOutlet
                ? subscription.outlet?.avatar
                : subscription.business_register_business?.avatar;

            return {
                subscriptionId: subscription.subscription_id,
                title: subscription.title,
                description: subscription.description,
                status: subscription.status,
                expirationDate: subscription.expiration_date,
                distanceCoverage: subscription.distance_coverage,
                branch: isOutlet
                    ? {
                        entityType: 'Outlet',
                        outletId: subscription.outlet?.outlet_id,
                        outletName: subscription.outlet?.outlet_name,
                        location: subscription.outlet?.location,
                        description: subscription.outlet?.description,
                        banStatus: subscription.outlet?.banStatus,
                        avatar: avatar
                            ? {
                                avatarId: avatar.id,
                                base: avatar.base,
                                hat: avatar.hat,
                                shirt: avatar.shirt,
                                bottom: avatar.bottom,
                            }
                            : null,
                    }
                    : {
                        entityType: 'Business_register_business',
                        registrationId: subscription.business_register_business?.registration_id,
                        entityName: subscription.business_register_business?.entityName,
                        location: subscription.business_register_business?.location,
                        banStatus: subscription.business_register_business?.banStatus,
                        category: subscription.business_register_business?.category,
                        avatar: avatar
                            ? {
                                avatarId: avatar.id,
                                base: avatar.base,
                                hat: avatar.hat,
                                shirt: avatar.shirt,
                                bottom: avatar.bottom,
                            }
                            : null,
                    },
            };
        });

        return res.status(200).json(subscriptionsWithAvatars);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateCustomerXP = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { xpAmount } = req.body;

        // Validate XP amount
        if (!xpAmount || typeof xpAmount !== 'number' || xpAmount <= 0) {
            res.status(400).json({
                status: 400,
                message: "Invalid XP amount",
            });
            return;
        }

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

        // Calculate current level before XP update
        const previousLevel = calculateLevel(customer_account.exp);

        // Update XP
        customer_account.exp += xpAmount;
        await customer_account.save();

        // Calculate new level after XP update
        const currentLevel = calculateLevel(customer_account.exp);
        const xpForCurrentLevel = calculateTotalXpForLevel(currentLevel);
        const xpForNextLevel = calculateTotalXpForLevel(currentLevel + 1) - xpForCurrentLevel;

        // Prepare response data
        const responseData = {
            previousLevel,
            currentLevel,
            totalXP: customer_account.exp,
            xpForNextLevel,
            xpProgress: customer_account.exp - xpForCurrentLevel,
            leveledUp: currentLevel > previousLevel
        };

        res.status(200).json({
            status: 200,
            message: "XP updated successfully",
            data: responseData
        });

    } catch (error) {
        console.error("Error updating XP:", error);
        res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }

    
};

export const customerCashback = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({ message: "Quantity must be a positive number" });
        return;
    }

    try {
        const customer = await Customer_account.findOne({ where: { id: userId } });

        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        customer.gem_balance += quantity;
        await customer.save();

        res.status(200).json({
            message: "Cashback added successfully",
            new_balance: customer.gem_balance
        });
    } catch (error) {
        console.error('Error adding cashback:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCustomerTransactions = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const transactions = await Customer_transaction.find({
            where: { customer_account: { id: userId } },
            order: { transaction_date: "DESC" },
        });

        res.status(200).json({ transactions });
    } catch (error) {
        console.error('Error fetching customer transactions:', error);
        res.status(500).json({ message: error.message });
    }
}