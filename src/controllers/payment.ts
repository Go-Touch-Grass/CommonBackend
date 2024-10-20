import { Request, Response } from 'express';
import { stripe } from '../index';
import { Customer_group_purchase } from '../entities/Customer_group_purchase';
import { Customer_account } from '../entities/Customer_account';

export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency } = req.body;

    // Create a PaymentIntent with the amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in the smallest unit of the currency (e.g., cents for USD)
      currency: currency, // e.g., 'usd'
    });

    // Send client secret to the frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


type PaymentIntentInfo = {
  customer_id: number;
  clientSecret: string | null;
};

export const finalizeGroupPurchase = async (req: Request, res: Response) => {
  const { group_purchase_id, amount, currency } = req.body;

  try {
    // Fetch group purchase and ensure it's completed
    const groupPurchase = await Customer_group_purchase.findOne({
      where: { id: Number(group_purchase_id) },
      relations: ["participants", "voucher"],
    });

    if (!groupPurchase || groupPurchase.status !== "complete") {
      return res.status(400).json({ message: "Group purchase is not complete or does not exist." });
    }

    // Iterate over each participant and create a payment intent
    const paymentIntents: PaymentIntentInfo[] = [];
    for (const participant of groupPurchase.participants) {
      // TODO RE - calculate the amount. need to split among the number of participants.
      const amount = groupPurchase.voucher.discountedPrice * 100; // Stripe uses smallest currency unit (in cents thus, *by 100)
      const customer = await Customer_account.findOne({
        where: { id: participant.customer.id },
      });

      if (!customer) continue;

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: currency, // Set the currency
        metadata: {
          customerId: customer.id,
          groupPurchaseId: groupPurchase.id,
        }
      });

      // Store the clientSecret for each participant
      paymentIntents.push({
        customer_id: customer.id,
        clientSecret: paymentIntent.client_secret,
      });
    }

    // Return all payment intents (one for each participant)
    return res.status(200).json({ paymentIntents });
  } catch (error) {
    console.error("Error finalizing group purchase:", error);
    return res.status(500).json({ message: "Error finalizing group purchase" });
  }
};