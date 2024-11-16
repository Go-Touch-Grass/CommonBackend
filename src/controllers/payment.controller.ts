import { Request, Response } from 'express';
import { stripe } from '../index';
import { Customer_group_purchase } from '../entities/customerGroupPurchase.entity';
import { Customer_account } from '../entities/customerAccount.entity';
import { UserRole } from '../entities/abstract/abstractUser.entity';
import { Business_account } from '../entities/businessAccount.entity';
import { Customer_inventory } from '../entities/customerInventory.entity';
import { Customer_voucher } from '../entities/customerVouchers.entity';
import { Business_transaction, TransactionType } from '../entities/businessTransaction.entity';
import { Customer_transaction } from '../entities/customerTransaction.entity';

type PaymentIntentInfo = {
  customer_id: number;
  clientSecret: string | null;
  paymentIntentId: string;
};

const priceIds = {
  bundle50Gems: process.env.STRIPE_PRICE_ID_50_GEMS,
  bundle100Gems: process.env.STRIPE_PRICE_ID_100_GEMS,
  bundle250Gems: process.env.STRIPE_PRICE_ID_250_GEMS,
  bundle500Gems: process.env.STRIPE_PRICE_ID_500_GEMS,
  bundle1000Gems: process.env.STRIPE_PRICE_ID_1000_GEMS,
}

export const finalizeGroupPurchase = async (req: Request, res: Response) => {
  const { group_purchase_id } = req.body;
  //console.log('Received group_purchase_id:', group_purchase_id);
  const quantity = 1;

  if (!group_purchase_id) {
    return res.status(400).json({ message: "Group purchase ID is missing." });
  }
  try {
    // Fetch group purchase and ensure it's completed
    const groupPurchase = await Customer_group_purchase.findOne({
      where: { id: Number(group_purchase_id) },
      relations: [
        "participants",
        "participants.customer",
        "voucher",
        "voucher.business_register_business",
        "voucher.business_register_business.business_account",
        "voucher.outlet",
        "voucher.outlet.business",
      ],
    });

    if (!groupPurchase || groupPurchase.groupStatus !== "completed") {
      return res.status(400).json({ message: "Group purchase is not complete or does not exist." });
    }

    // Check if the group is full and all participants have joined
    if (groupPurchase.current_size < groupPurchase.group_size) {
      return res.status(400).json({ message: "Group is not yet full." });
    }

    // Calculate the final price per user, including both voucher discount and group discount
    const voucherPrice = groupPurchase.voucher.price;
    const voucherDiscount = groupPurchase.voucher.discount;
    const groupDiscount = groupPurchase.voucher.groupDiscount; // Assuming group discount is stored on the groupPurchase

    const finalPricePerUser = voucherPrice * (1 - voucherDiscount / 100) * (1 - groupDiscount / 100);
    const conversionRate = 10;
    const finalPriceInGems = Math.round(finalPricePerUser * conversionRate);

    let allParticipantsHaveEnoughGems = true;
    const insufficientGemsParticipants: Array<{ username: string, balance: number }> = [];
    // Check all participants' gem balance
    for (const participant of groupPurchase.participants) {
      const customer = await Customer_account.findOne({
        where: { id: participant.customer.id },
      });

      if (!customer) continue;

      // Check if the customer has enough gems
      if (customer.gem_balance < finalPriceInGems) {
        insufficientGemsParticipants.push({
          username: customer.username,
          balance: customer.gem_balance,
        });
        allParticipantsHaveEnoughGems = false;
      }
    }

    // If any participants have insufficient gems, return an error message
    if (!allParticipantsHaveEnoughGems) {
      return res.status(400).json({
        message: "Some participants have insufficient gems.",
        insufficientParticipants: insufficientGemsParticipants
      });
    }

    let businessAccount: Business_account | undefined;
    if (groupPurchase.voucher.business_register_business) {
      const businessRegisterBusiness = groupPurchase.voucher.business_register_business;
      businessAccount = businessRegisterBusiness.business_account;
    } else if (groupPurchase.voucher.outlet) {
      const outlet = groupPurchase.voucher.outlet;
      businessAccount = outlet.business;
    }

    // Check if businessAccount is assigned
    if (!businessAccount) {
      return res.status(400).json({ message: "Associated business account not found" });
    }

    // Process payments for all participants if all have sufficient gems
    let allPaymentsSuccessful = true;
    // Iterate over each participant and charge gems
    for (const participant of groupPurchase.participants) {
      //console.log(`Processing participant ${participant.customer.id}`);
      const customer = await Customer_account.findOne({
        where: { id: participant.customer.id },
      });

      if (!customer) continue;
      try {
        // Deduct the required gems from the customer's gem balance
        customer.gem_balance -= finalPriceInGems;
        await customer.save();

        // Log the transaction in the customer's transaction history
        const customerTransaction = Customer_transaction.create({
          gems_deducted: finalPriceInGems,
          customer_account: customer,
        });
        await customerTransaction.save();

        // Increment the business's gem balance
        businessAccount.gem_balance += finalPriceInGems;
        await businessAccount.save();

        // Update participant's payment status and record the payment completion time
        participant.payment_status = 'paid';
        participant.payment_completed_at = new Date();
        await participant.save();



        /////////////  Add Voucher to Inventory:
        // Fetch or create the customer's inventory
        let inventory = await Customer_inventory.findOne({
          where: { customer_account: { id: customer.id } },
          relations: ['voucherInstances'],
        });

        if (!inventory) {
          inventory = new Customer_inventory();
          inventory.customer_account = customer;
          await inventory.save();
        }

        // Check if the customer already owns this voucher
        let customerVoucher = await Customer_voucher.findOne({
          where: { inventory: { id: inventory.id }, voucher: { listing_id: groupPurchase.voucher.listing_id } },
        });

        if (customerVoucher) {
          // If they already own the voucher, update the quantity
          customerVoucher.quantity += quantity;
        } else {
          // Otherwise, create a new Customer_voucher entry
          customerVoucher = new Customer_voucher();
          customerVoucher.inventory = inventory;
          customerVoucher.voucher = groupPurchase.voucher;
          customerVoucher.quantity = quantity;
        }
        await customerVoucher.save();

        // Add reward item to customer's inventory if applicable
        if (groupPurchase.voucher.rewardItem) {
          const customerWithItems = await Customer_account.findOne({
            where: { id: customer.id },
            relations: ['ownedItems']
          });

          if (customerWithItems) {
            const alreadyOwnsItem = customerWithItems.ownedItems.some(item => item.id === groupPurchase.voucher.rewardItem!.id);
            if (!alreadyOwnsItem) {
              customerWithItems.ownedItems.push(groupPurchase.voucher.rewardItem);
              await customerWithItems.save();
            }
          }
        }

        //////////////////


      } catch (error) {
        console.error(`Payment failed for participant ${participant.customer.id}:`, error);
        // Mark this participant's payment as failed
        participant.payment_status = 'failed';
        await participant.save();
        allPaymentsSuccessful = false;
      }
    }

    // If any payments failed, return an error and do not mark the group purchase as completed
    if (!allPaymentsSuccessful) {
      return res.status(500).json({
        message: "One or more payments failed. Group purchase could not be completed"
      });
    }

    // Return success response
    groupPurchase.paymentStatus = 'completed';
    await groupPurchase.save();
    return res.status(200).json({ message: "Group purchase completed successfully, and all users have been charged in gems." });
  } catch (error) {
    console.error("Error finalizing group purchase:", error.message);
    return res.status(500).json({ message: "Error finalizing group purchase" });
  }
};



const getUserFromDB = async (userId: number, userRole: UserRole): Promise<Business_account | Customer_account> => {
  let user: Business_account | Customer_account | null = null;

  if (userRole === UserRole.BUSINESS) {
    // Retrieve business from database
    user = await Business_account.findOne({ where: { business_id: userId } });
  } else if (userRole === UserRole.CUSTOMER) {
    // Retrieve customer from database
    user = await Customer_account.findOne({ where: { id: userId } });
  }
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

const createOrGetUserStripeId = async (userId: number, userRole: UserRole): Promise<string> => {
  const user = await getUserFromDB(userId, userRole);

  if (!user.stripeCustomerId) {
    // Create a new Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.username,
      description: user.role === UserRole.BUSINESS
        ? `Business account for ${user.username}`
        : `Customer account for ${user.username}`,
    });
    user.stripeCustomerId = stripeCustomer.id;
    await user.save();
  }
  return user.stripeCustomerId;
}

export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency } = req.body;

    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const userStripeId = await createOrGetUserStripeId(userId, userRole);

    // Create a PaymentIntent with the amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in the smallest unit of the currency (e.g., cents for USD)
      currency: currency, // e.g., 'usd'
      customer: userStripeId,
      payment_method_types: ['card'],
      setup_future_usage: 'on_session',
    });

    // Send client secret to the frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStripeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productName } = req.body;
    const priceId = priceIds[productName];

    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const userStripeId = await createOrGetUserStripeId(userId, userRole);

    // Create a new subscription
    const subscription = await stripe.subscriptions.create({
      customer: userStripeId,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Check if latest_invoice is valid and payment_intent is a PaymentIntent object
    const latestInvoice = subscription.latest_invoice;
    if (latestInvoice && typeof latestInvoice !== 'string' && latestInvoice.payment_intent) {
      const paymentIntent = latestInvoice.payment_intent;

      // Check if payment_intent is an object and contains client_secret
      if (typeof paymentIntent !== 'string' && paymentIntent.client_secret) {
        res.status(200).json({
          clientSecret: paymentIntent.client_secret,
          subscriptionId: subscription.id,
        });
      } else {
        res.status(500).json({ error: 'No valid client secret found in payment intent.' });
      }
    } else {
      res.status(500).json({ error: 'No valid payment intent found for the subscription.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getUserEmailandUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const user = await getUserFromDB(userId, userRole);

    res.status(200).json({
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const savePaymentMethodId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentMethodId } = req.body;

    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const user = await getUserFromDB(userId, userRole);

    // Attach the payment method to the user
    user.paymentMethodId = paymentMethodId;
    await user.save();

    res.status(200).json({ message: 'Payment method saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getPaymentMethodId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const user = await getUserFromDB(userId, userRole);

    res.status(200).json({ paymentMethodId: user.paymentMethodId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const deletePaymentMethodId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const user = await getUserFromDB(userId, userRole);

    // Detach the payment method from the user
    user.paymentMethodId = null;
    await user.save();

    res.status(200).json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const user = await getUserFromDB(userId, userRole);

    if (!user.stripeCustomerId || !user.paymentMethodId) {
      // No saved payment method found, respond with an empty object
      res.status(200).json({ message: 'No saved payment method found.' });
      return;
    }

    const userStripeId = user.stripeCustomerId;
    const paymentMethodId = user.paymentMethodId;

    const paymentMethod = await stripe.customers.retrievePaymentMethod(userStripeId, paymentMethodId!);

    // Check if the payment method exists
    if (!paymentMethod) {
      res.status(200).json({ message: 'No saved payment method found.' });
      return;
    }

    // Respond with the payment method details
    res.json(paymentMethod);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getUserStripeIdAndEphemeralKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const userStripeId = await createOrGetUserStripeId(userId, userRole);

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: userStripeId },
      { apiVersion: '2024-06-20' }
    );

    res.status(200).json({ userStripeId, ephemeralKeySecret: ephemeralKey.secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getBusinessStripeAccountStatus = async (req: Request, res: Response): Promise<void> => {
  const businessId = (req as any).user.id;
  const business = await Business_account.findOne({ where: { business_id: businessId } });

  if (!business) {
    res.status(404).json({ message: 'Business account not found' });
    return;
  }

  res.json({
    stripeAccountId: business.stripeAccountId,
    gemBalance: business.gem_balance,
  });
};

export const createBusinessOnboardingLink = async (req: Request, res: Response): Promise<void> => {
  const businessId = (req as any).user.id;
  const business = await Business_account.findOne({ where: { business_id: businessId } });

  if (!business) {
    res.status(404).json({ message: 'Business account not found' });
    return;
  }

  if (!business.stripeAccountId) {
    const account = await stripe.accounts.create({
      country: 'SG',
      email: business.email,
      controller: {
        fees: {
          payer: 'application',
        },
        losses: {
          payments: 'application',
        },
        stripe_dashboard: {
          type: 'express',
        },
      },
    });
    business.stripeAccountId = account.id;
    await business.save();
  }

  const accountLink = await stripe.accountLinks.create({
    account: business.stripeAccountId,
    refresh_url: 'http://localhost:3000/cashout',
    return_url: 'http://localhost:3000/cashout',
    type: 'account_onboarding',
  });

  res.json({ onboardingUrl: accountLink.url });
}

export const cashout = async (req: Request, res: Response): Promise<void> => {
  try {
    const businessId = (req as any).user.id;
    const {
      currency_amount: currencyAmount, // In SGD
      gem_amount: gemAmount,
    } = req.body;

    const business = await Business_account.findOne({ where: { business_id: businessId } });
    if (!business || business.gem_balance < gemAmount) {
      res.status(400).json({ error: 'Insufficient gems' });
      return;
    }

    const transfer = await stripe.transfers.create({
      amount: currencyAmount * 100, // Convert to cents
      currency: 'sgd',
      destination: business.stripeAccountId,
    });

    // Update gem balance and save transaction record
    business.gem_balance -= gemAmount;
    await business.save();

    // Create a new transaction record
    const businessTransaction = Business_transaction.create({
      currency_amount: currencyAmount,
      gems_deducted: gemAmount,
      transaction_type: TransactionType.GEM_CASHOUT,
      business_account: business,
    });
    businessTransaction.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
