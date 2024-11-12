import { Request, Response } from 'express';
import { Business_account } from '../entities/businessAccount.entity';
import { Business_voucher } from '../entities/businessVoucher.entity';
import { In } from 'typeorm';

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