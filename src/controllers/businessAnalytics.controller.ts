import { Request, Response } from 'express';
import { Business_account } from '../entities/businessAccount.entity';
import { Business_voucher } from '../entities/businessVoucher.entity';
import { In } from 'typeorm';
import { Item } from '../entities/item.entity';

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

    res.json({ mostPopularVoucher});
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
        listing_id: voucher.listing_id,
        name: voucher.name,
        description: voucher.description,
        price: voucher.price,
        discount: voucher.discount,
        voucherImage: voucher.voucherImage,
        created_at: voucher.created_at,
        updated_at: voucher.updated_at,
        duration: voucher.duration,
        expirationDate: voucher.expirationDate,
        discountedPrice: voucher.discountedPrice,
        groupPurchaseEnabled: voucher.groupPurchaseEnabled,
        groupSize: voucher.groupSize,
        groupDiscount: voucher.groupDiscount,
        rewardItem: voucher.rewardItem,
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