import { Request, Response } from "express";
import { Customer_account } from "../entities/Customer_account";
import { Customer_inventory } from "../entities/Customer_inventory";
import { Business_voucher } from "../entities/Business_voucher";
import { Voucher_transaction } from "../entities/Voucher_transaction";
import { Item, ItemType } from "../entities/Item";
import { In, IsNull } from "typeorm";
import { statusEnum } from "../entities/Business_register_business";
import { Customer_voucher } from "../entities/Customer_vouchers";


export const updateVoucherStatus = async (req, res) => {
    const { voucherId, status } = req.body; // Get voucherId and status from request body

    if (typeof voucherId !== 'number' || typeof status !== 'boolean') {
        return res.status(400).json({ error: 'Voucher ID must be a number and status must be a boolean value' });
    }

    try {
        // Find the voucher by ID
        const voucher = await Customer_voucher.findOne({ where: { id: voucherId } });

        if (!voucher) {
            return res.status(404).json({ error: 'Voucher not found' });
        }

        // Update the voucher's status
        voucher.status = false; // Assuming `redeemed` is the field to be updated
        await voucher.save();

        return res.status(200).json({ message: 'Voucher status updated successfully', voucher });
    } catch (error) {
        console.error('Error updating voucher status:', error);
        return res.status(500).json({ error: 'An error occurred while updating the voucher status' });
    }
};

export const getVoucherInventory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        console.log('User ID:', userId);

        // Fetch customer account with inventory and related vouchers (Customer_voucher)
        const customerAccount = await Customer_account.findOne({
            where: { id: userId },
            relations: [
                "customer_inventory",
                "customer_inventory.voucherInstances", // Customer_vouchers related to inventory
                "customer_inventory.voucherInstances.voucher", // Business_voucher associated with Customer_voucher
            ],
        });

        if (!customerAccount || !customerAccount.customer_inventory) {
            res.status(404).json({ status: 404, message: "User or inventory not found" });
            return;
        }

        const inventory = customerAccount.customer_inventory;
        const voucherInstances = inventory.voucherInstances;

        if (!voucherInstances || voucherInstances.length === 0) {
            res.status(404).json({ status: 404, message: "No vouchers found in inventory" });
            return;
        }

        // Fetch all voucher transactions for the user (only redeem information)
        const voucherTransactions = await Voucher_transaction.find({
            where: { customerId: userId },
            relations: ['voucher'], // Business_voucher relation to get transaction details
        });

        // Map the customer vouchers (Customer_voucher) and fetch their related Business_voucher details
        const vouchersWithDetails = voucherInstances.map(customerVoucher => {
            const businessVoucher = customerVoucher.voucher;
            const transaction = voucherTransactions.find(t => t.voucher.listing_id === businessVoucher.listing_id);

            return {
                ...businessVoucher,
                redeemed: transaction ? transaction.redeemed : false,
                transaction_id: transaction ? transaction.id : null,
                quantity: customerVoucher.quantity,
                status: customerVoucher.status
            };
        });


        // Respond with the voucher details and transaction info
        res.json({
            status: 200,
            vouchers: vouchersWithDetails,
            inventoryUsed: inventory.used,
        });
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.status(500).json({ status: 500, message: "Internal server error" });
    }
};

export const purchaseVoucher = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { voucherId, quantity = 1 } = req.body; // Accepting quantity if needed

    try {
        // Fetch the Business Voucher
        const voucher = await Business_voucher.findOne({
            where: { listing_id: voucherId },
            relations: ['business_register_business', 'outlet', 'rewardItem']
        });

        if (!voucher) {
            res.status(404).json({ message: "Voucher not found" });
            return;
        }

        const discountedPrice = voucher.price - (voucher.price * (voucher.discount / 100));
        const conversionRate = 10;
        const discountedPriceInGems = Math.round(discountedPrice * conversionRate);
        const totalCost = discountedPriceInGems * quantity;

        // Fetch the customer account
        const customer = await Customer_account.findOne({ where: { id: userId } });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        // Check if the customer has enough gems
        if (customer.gem_balance < totalCost) {
            res.status(400).json({ message: "Insufficient gem balance" });
            return;
        }

        // Deduct the total cost from the customer's gem balance
        customer.gem_balance -= totalCost;
        await customer.save();

        // Fetch or create the customer's inventory
        let inventory = await Customer_inventory.findOne({
            where: { customer_account: { id: userId } },
            relations: ['voucherInstances'],
        });

        if (!inventory) {
            inventory = new Customer_inventory();
            inventory.customer_account = customer;
            await inventory.save();
        }

        // Check if the customer already owns this voucher
        let customerVoucher = await Customer_voucher.findOne({
            where: { inventory: { id: inventory.id }, voucher: { listing_id: voucher.listing_id } },
        });

        if (customerVoucher) {
            // If they already own the voucher, update the quantity
            customerVoucher.quantity += quantity;
        } else {
            // Otherwise, create a new Customer_voucher entry
            customerVoucher = new Customer_voucher();
            customerVoucher.inventory = inventory;
            customerVoucher.voucher = voucher;
            customerVoucher.quantity = quantity;
        }
        await customerVoucher.save();

        // Add reward item to customer's inventory if applicable
        if (voucher.rewardItem) {
            const customerWithItems = await Customer_account.findOne({
                where: { id: userId },
                relations: ['ownedItems']
            });

            if (customerWithItems) {
                const alreadyOwnsItem = customerWithItems.ownedItems.some(item => item.id === voucher.rewardItem!.id);
                if (!alreadyOwnsItem) {
                    customerWithItems.ownedItems.push(voucher.rewardItem);
                    await customerWithItems.save();
                }
            }
        }

        // Record the transaction
        //const transaction = new Voucher_transaction();
        //transaction.voucher = voucher;
        //transaction.gems_spent = totalCost;
        //transaction.customerId = userId;
        //transaction.redeemed = false;
        //transaction.purchaseDate = new Date();
        //await transaction.save();

        // Return success response
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
                //voucher_transaction_id: transaction.id,
                quantity: customerVoucher.quantity, // Returning the quantity
                reward_item: voucher.rewardItem ? {
                    id: voucher.rewardItem.id,
                    name: voucher.rewardItem.name,
                    type: voucher.rewardItem.type
                } : null,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const redeemVoucher = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { voucherId } = req.body; // Accepting the voucher ID to redeem

    // Log the voucherId to see what is passed
    console.log('Voucher ID received for redemption:', voucherId);

    try {
        // Fetch the customer's voucher
        const customerVoucher = await Customer_voucher.findOne({
            where: {
                voucher: { listing_id: voucherId },
                inventory: { customer_account: userId }, // Assuming customer_account is directly linked to inventory
            },
            relations: ['voucher', 'inventory', 'inventory.customer_account'],
        });

        // Check if the voucher exists and if the customer has sufficient quantity
        if (!customerVoucher || customerVoucher.quantity <= 0) {
            res.status(404).json({ message: "Voucher not found or insufficient quantity" });
            return;
        }

        // Create a new transaction for redemption
        const transaction = new Voucher_transaction();

        // Assign the voucher entity to the transaction
        transaction.voucher = customerVoucher.voucher; // Ensure this is the correct entity
        transaction.customerId = userId;
        transaction.redeemed = "pending"; // Set as redeemed
        transaction.purchaseDate = new Date();
        transaction.gems_spent = (customerVoucher.voucher.discountedPrice) * 10;
        await transaction.save(); // Save the transaction

        // Return success response
        res.status(200).json({
            message: "Voucher redeemed successfully, awaiting business approval.",
            transaction_id: transaction.id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};





export const addItemToCustomerInventory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const { itemId } = req.body;

        const customer = await Customer_account.findOne({
            where: { id: userId },
            relations: ['ownedItems']
        });

        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        const item = await Item.findOne({ where: { id: itemId } });

        if (!item) {
            res.status(404).json({ message: "Item not found" });
            return;
        }

        if (customer.ownedItems.some(ownedItem => ownedItem.id === item.id)) {
            res.status(400).json({ message: "Customer already owns this item" });
            return;
        }

        customer.ownedItems.push(item);
        await customer.save();

        res.status(200).json({
            message: "Item added to customer inventory successfully",
            item: {
                id: item.id,
                name: item.name,
                // Add other relevant item properties here
            }
        });
    } catch (error) {
        console.error('Error adding item to customer inventory:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getCustomerItems = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const customer = await Customer_account.findOne({
            where: { id: userId },
            relations: ['ownedItems']
        });

        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        // Get IDs of items owned by the customer
        const ownedItemIds = customer.ownedItems.map(item => item.id);

        // Fetch public items and items owned by the customer
        const items = await Item.find({
            where: [
                { id: In(ownedItemIds) },
                {
                    business_register_business: IsNull(),
                    outlet: IsNull(),
                    status: statusEnum.APPROVED
                }
            ]
        });

        // Categorize items
        const categorizedItems: Record<ItemType, any[]> = {
            [ItemType.BASE]: [],
            [ItemType.HAT]: [],
            [ItemType.SHIRT]: [],
            [ItemType.BOTTOM]: []
        };

        items.forEach(item => {
            const itemData = {
                id: item.id,
                name: item.name,
                type: item.type,
                filepath: item.filepath,
                scale: item.scale,
                xOffset: item.xOffset,
                yOffset: item.yOffset,
                isOwned: ownedItemIds.includes(item.id)
            };

            categorizedItems[item.type].push(itemData);
        });

        res.status(200).json({
            message: "Items fetched successfully",
            items: categorizedItems
        });
    } catch (error) {
        console.error('Error fetching customer items:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};
