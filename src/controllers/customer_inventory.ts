import { Request, Response } from "express";
import { Customer_account } from "../entities/Customer_account";
import { Customer_inventory } from "../entities/Customer_inventory";
import { Business_voucher } from "../entities/Business_voucher";
import { Voucher_transaction } from "../entities/Voucher_transaction";
import { Item, ItemType } from "../entities/Item";
import { In, IsNull } from "typeorm";
import { statusEnum } from "../entities/Business_register_business";

export const getVoucherInventory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;

        const customerAccount = await Customer_account.findOne({
            where: { id: userId },
            relations: ["customer_inventory", "customer_inventory.vouchers"],
        });

        if (!customerAccount || !customerAccount.customer_inventory) {
            res.status(404).json({ status: 404, message: "User or inventory not found" });
            return;
        }

        const inventory = customerAccount.customer_inventory;

        if (!inventory.vouchers || inventory.vouchers.length === 0) {
            res.status(404).json({ status: 404, message: "No vouchers found in inventory" });
            return;
        }

        const voucherTransactions = await Voucher_transaction.find({
            where: { customerId: userId },
            relations: ['voucher'],
        });

        const vouchersWithTransactions = inventory.vouchers.map(voucher => {
            const transaction = voucherTransactions.find(t => t.voucher.listing_id === voucher.listing_id);
            return {
                ...voucher,
                voucher_transaction_id: transaction ? transaction.id : null,
                redeemed: transaction ? transaction.redeemed : false,
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

export const purchaseVoucher = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { voucherId } = req.body;

    try {
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

        const customer = await Customer_account.findOne({ where: { id: userId } });
        if (!customer) {
            res.status(404).json({ message: "Customer not found" });
            return;
        }

        if (customer.gem_balance < discountedPriceInGems) {
            res.status(400).json({ message: "Insufficient gem balance" });
            return;
        }

        customer.gem_balance -= discountedPriceInGems;
        await customer.save();

        let inventory = await Customer_inventory.findOne({
            where: { customer_account: { id: userId } },
            relations: ['vouchers'],
        });

        if (!inventory) {
            inventory = new Customer_inventory();
            inventory.customer_account = customer;
            await inventory.save();
        }

        if (!inventory.vouchers.includes(voucher)) {
            inventory.vouchers.push(voucher);
            await inventory.save();
        }

        // Add reward item to customer's inventory if it exists
        if (voucher.rewardItem) {
            const customer = await Customer_account.findOne({
                where: { id: userId },
                relations: ['ownedItems']
            });

            if (customer) {
                const alreadyOwnsItem = customer.ownedItems.some(item => item.id === voucher.rewardItem!.id);
                if (!alreadyOwnsItem) {
                    customer.ownedItems.push(voucher.rewardItem);
                    await customer.save();
                }
            }
        }

        const transaction = new Voucher_transaction();
        transaction.voucher = voucher;
        transaction.gems_spent = discountedPriceInGems;
        transaction.customerId = userId;
        transaction.redeemed = false;
        transaction.purchaseDate = new Date();
        await transaction.save();

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
