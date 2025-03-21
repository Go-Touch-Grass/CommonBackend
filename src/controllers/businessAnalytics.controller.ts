import { Request, Response } from 'express';
import { Business_account } from '../entities/businessAccount.entity';
import { Business_voucher } from '../entities/businessVoucher.entity';
import { Item } from '../entities/item.entity';
import { Business_transaction, TransactionType } from '../entities/businessTransaction.entity';
import { Avatar } from '../entities/avatar.entity';
import { paymentStatusEnum } from '../entities/customerGroupPurchase.entity';
import { In, Between } from 'typeorm';
import { AppDataSource } from '../index';

export const getMostPopularVoucher = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Step 1: Fetch the main business and its outlets
    const businessAccount = await Business_account.findOne({
      where: { business_id: businessId },
      relations: ['business', 'outlets'],
    });

    if (!businessAccount) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Step 2: Collect all vouchers associated with both main business and outlets
    const businessVouchers = await Business_voucher.find({
      where: [
        { business_register_business: businessAccount.business },
        { outlet: { outlet_id: In(businessAccount.outlets.map(outlet => outlet.outlet_id)) } },
      ],
      relations: ['transactions', 'rewardItem'],
    });

    // Step 3: Determine the voucher with the highest number of transactions
    const mostPopularVoucher = businessVouchers.reduce<Business_voucher | null>(
      (maxVoucher, currentVoucher) => {
        const currentTransactionCount = currentVoucher.transactions.length;

        if (!maxVoucher || currentTransactionCount > maxVoucher.transactions.length) {
          return currentVoucher;
        }
        return maxVoucher;
      },
      null // Explicitly set initial value to null
    );


    if (!mostPopularVoucher) {
      res.status(404).json({ message: 'No vouchers found' });
      return;
    }

    res.json({ mostPopularVoucher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

interface VoucherWithRate {
  listing_id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  voucherImage: string;
  created_at: Date;
  updated_at: Date;
  duration: number;
  expirationDate: Date;
  discountedPrice: number;
  groupPurchaseEnabled: boolean;
  groupSize: number;
  groupDiscount: number;
  rewardItem: Item | null;
  vouchersUnredeemed: number;
  vouchersRedeemed: number;
  redemptionRate: number;
}

export const getVoucherRedemptionRate = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Step 1: Fetch the main business and its outlets
    const businessAccount = await Business_account.findOne({
      where: { business_id: businessId },
      relations: ['business', 'outlets'],
    });

    if (!businessAccount) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Step 2: Collect all vouchers associated with both main business and outlets
    const businessVouchers = await Business_voucher.find({
      where: [
        { business_register_business: businessAccount.business },
        { outlet: { outlet_id: In(businessAccount.outlets.map(outlet => outlet.outlet_id)) } },
      ],
      relations: ['voucherInstances', 'transactions', 'rewardItem'],
    });

    // Step 3: Calculate redemption rate and return new objects
    const vouchersWithRedemptionRate: VoucherWithRate[] = businessVouchers.map((voucher) => {
      const vouchersUnredeemed = voucher.voucherInstances.reduce((sum, instance) => sum + instance.quantity, 0);
      const vouchersRedeemed = voucher.transactions.length;
      const totalVouchers = vouchersUnredeemed + vouchersRedeemed;
      const redemptionRate = totalVouchers > 0 ? (vouchersRedeemed / totalVouchers) * 100 : 0;

      return {
        ...voucher,
        vouchersUnredeemed,
        vouchersRedeemed,
        redemptionRate: Math.round(redemptionRate * 100) / 100,
      };
    });

    // Step 4: Return the modified vouchers with additional attributes
    res.status(200).json({ vouchers: vouchersWithRedemptionRate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

interface VoucherTotalSales {
  listing_id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  voucherImage: string;
  created_at: Date;
  updated_at: Date;
  duration: number;
  expirationDate: Date;
  discountedPrice: number;
  groupPurchaseEnabled: boolean;
  groupSize: number;
  groupDiscount: number;
  rewardItem: Item | null;
  totalSales: number;
}

export const getTotalSales = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Step 1: Fetch the main business and its outlets
    const businessAccount = await Business_account.findOne({
      where: { business_id: businessId },
      relations: ['business', 'outlets'],
    });

    if (!businessAccount) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Step 2: Collect all vouchers associated with both main business and outlets
    const businessVouchers = await Business_voucher.find({
      where: [
        { business_register_business: businessAccount.business },
        { outlet: { outlet_id: In(businessAccount.outlets.map(outlet => outlet.outlet_id)) } },
      ],
      relations: ['voucherInstances', 'transactions', 'rewardItem'],
    });

    // Step 3: Calculate redemption rate and return new objects
    const vouchersWithTotalSales: VoucherTotalSales[] = businessVouchers.map((voucher) => {
      const vouchersUnredeemed = voucher.voucherInstances.reduce((sum, instance) => sum + instance.quantity, 0);
      const vouchersRedeemed = voucher.transactions.length;
      const totalVouchers = vouchersUnredeemed + vouchersRedeemed;

      return {
        ...voucher,
        totalSales: totalVouchers,
      };
    });

    // Step 4: Return the modified vouchers with additional attributes
    res.status(200).json({ vouchers: vouchersWithTotalSales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


export const getGemUtilization = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Get the current date and calculate the date from one year ago
    const currentDate = new Date();
    const pastYearDate = new Date();
    pastYearDate.setFullYear(currentDate.getFullYear() - 1);

    // Retrieve transactions for the past year with gems deducted
    const transactions = await Business_transaction.find({
      where: {
        business_account: { business_id: businessId },
        transaction_type: TransactionType.SUBSCRIPTION_PAYMENT,
        transaction_date: Between(pastYearDate, currentDate),
      },
      order: { transaction_date: "ASC" },
    });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getTransactionCounts = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Group transactions by type and count them
    const transactionCounts = await AppDataSource.getRepository(Business_transaction)
      .createQueryBuilder("transaction")
      .select("transaction.transaction_type", "transactionType")
      .addSelect("COUNT(*)", "count")
      .where("transaction.business_account = :businessId", { businessId })
      .groupBy("transaction.transaction_type")
      .getRawMany();

    // Convert count to a number after fetching if needed
    transactionCounts.forEach(item => item.count = Number(item.count));

    res.status(200).json({ transactionCounts });
  } catch (error) {
    console.error('Error fetching transaction counts:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAvatarEngagements = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Step 1: Fetch the main business and its outlets
    const businessAccount = await Business_account.findOne({
      where: { business_id: businessId },
      relations: ['business', 'outlets'],
    });

    if (!businessAccount) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Step 2: Collect all avatars associated with both main business and outlets
    const businessAvatars = await Avatar.find({
      where: [
        { business_register_business: businessAccount.business },
        { outlet: { outlet_id: In(businessAccount.outlets.map(outlet => outlet.outlet_id)) } },
      ],
      relations: ['business_register_business', 'outlet', 'base', 'hat', 'shirt', 'bottom'],
    });

    res.status(200).json({ avatars: businessAvatars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

interface VoucherGroupPurchaseAnalytics {
  listing_id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  voucherImage: string;
  created_at: Date;
  updated_at: Date;
  duration: number;
  expirationDate: Date;
  discountedPrice: number;
  groupPurchaseEnabled: boolean;
  groupSize: number;
  groupDiscount: number;
  rewardItem: Item | null;
  totalStarted: number;
  totalCompleted: number;
  completionPercentage: number;
}

export const getGroupPurchaseAnalytics = async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.id;

    // Step 1: Fetch the main business and its outlets
    const businessAccount = await Business_account.findOne({
      where: { business_id: businessId },
      relations: ['business', 'outlets'],
    });

    if (!businessAccount) {
      res.status(404).json({ message: 'Business not found' });
      return;
    }

    // Step 2: Collect all vouchers associated with both main business and outlets
    const registerBusinessId = businessAccount.business.registration_id;
    const outletIds = businessAccount.outlets.map(outlet => outlet.outlet_id);

    const businessVouchers = await Business_voucher.createQueryBuilder("voucher")
      .leftJoinAndSelect("voucher.rewardItem", "rewardItem")
      .leftJoinAndSelect("voucher.groupPurchases", "groupPurchases")
      .where("voucher.groupPurchaseEnabled = :enabled", { enabled: true })
      .andWhere(
        "(voucher.business_register_business = :registerBusinessId OR voucher.outlet IN (:...outletIds))",
        { registerBusinessId, outletIds }
      )
      .getMany();


    // Step 3: Calculate analytics for each voucher
    const analytics: VoucherGroupPurchaseAnalytics[] = businessVouchers.map(voucher => {
      const groupPurchases = voucher.groupPurchases ?? [];
      const totalStarted = groupPurchases.length;
      const totalCompleted = groupPurchases.filter(
        (purchase) => purchase.paymentStatus === paymentStatusEnum.COMPLETED
      ).length;
      const completionPercentage = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

      return {
        ...voucher,
        totalStarted,
        totalCompleted,
        completionPercentage: Number(completionPercentage.toFixed(2)),
      };
    });

    // Step 4: Return the analytics data
    return res.status(200).json(analytics);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};