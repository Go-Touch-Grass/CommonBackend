import { Request, Response } from "express";
import { Business_account } from "../entities/businessAccount.entity";
import { Business_register_business } from "../entities/businessRegisterBusiness.entity";
import { Outlet } from "../entities/outlet.entity";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  generateOTP,
  sendOTPEmail,
  sendSubscriptionRenewEmail,
} from "../utils/otp";
import { BusinessAccountSubscription } from "../entities/businessAccountSubscription.entity";
import { Business_transaction } from "../entities/businessTransaction.entity";
import { addMonths } from "date-fns"; // Import a helper function for date manipulation
import { Between, getRepository, LessThanOrEqual } from "typeorm";
import { Business_voucher } from "../entities/businessVoucher.entity";
import { IsNull } from "typeorm";
import { stripe } from "../index";
import cron from 'node-cron';
import { Item } from '../entities/item.entity';
import { Voucher_transaction } from '../entities/voucherTransaction.entity';
import { Customer_account } from '../entities/customerAccount.entity';
import { Customer_inventory } from '../entities/customerInventory.entity';

export const handleMarkUsed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.body; // Assuming the transaction ID is sent in the request body
    const transactionIdNum = parseInt(transactionId, 10);

    if (isNaN(transactionIdNum)) {
      res.status(400).json({ message: 'Invalid transaction ID' });
      return;
    }

    // Find the transaction by ID
    const transaction = await Voucher_transaction.findOne({
      where: { id: transactionIdNum },
      relations: ['voucher'], // Load the associated voucher if needed
    });

    if (!transaction || !transaction.voucher) {
      res.status(404).json({ message: 'Voucher transaction or associated voucher not found' });
      return;
    }

    // Check if the transaction is already marked as used
    if (transaction.used === true) { // Assuming 'used' is a boolean property
      res.status(400).json({ message: 'Voucher transaction already marked as used' });
      return;
    }

    // Mark the transaction as used
    transaction.used = true; // Set the used status to true

    // Save the updated transaction
    await transaction.save();

    res.status(200).json({
      message: 'Voucher transaction marked as used successfully',
      transaction: {
        id: transaction.id,
        used: transaction.used, // Return the updated used status
        customerId: transaction.customerId,
        voucherId: transaction.voucherId,
      },
    });
  } catch (error) {
    console.error('Error marking voucher transaction as used:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateVoucherTransactionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId, redeemed } = req.body; // Assuming redeemed is a string ('yes', 'no', 'pending')
    const transactionIdNum = parseInt(transactionId, 10);

    if (isNaN(transactionIdNum)) {
      res.status(400).json({ message: 'Invalid transaction ID' });
      return;
    }

    // Find the transaction by ID
    const transaction = await Voucher_transaction.findOne({
      where: { id: transactionIdNum },
      relations: ['voucher'], // Load the associated voucher if needed
    });

    if (!transaction || !transaction.voucher) {
      res.status(404).json({ message: 'Voucher transaction or associated voucher not found' });
      return;
    }

    // Check if the transaction is already redeemed
    if (transaction.redeemed === 'yes') {
      res.status(400).json({ message: 'Voucher transaction already redeemed' });
      return;
    }

    // Update the transaction's redeemed status
    transaction.redeemed = redeemed; // Set the redeemed status to the value from the request body

    // If the voucher is being redeemed ('yes'), find the corresponding customer inventory
    if (redeemed === 'yes') {
      const customerInventory = await Customer_inventory.findOne({
        where: { customer_account: { id: transaction.customerId } }, // Use an object to reference the customer account
        relations: ['voucherInstances'], // Load associated voucher instances
      });

      if (customerInventory) {
        // Find the specific voucher instance in the customer's inventory
        const customerVoucher = customerInventory.voucherInstances.find(v => v.id === transaction.voucher.listing_id);

        if (customerVoucher) {
          // Deduct the quantity by 1 upon redemption
          if (customerVoucher.quantity > 0) {
            customerVoucher.quantity -= 1; // Decrease quantity by 1

            // Save the updated voucher in the customer's inventory
            await customerVoucher.save();

            if (customerVoucher.quantity === 0) {
              // Optional: Handle logic for when the voucher is fully used up, if needed
              console.log('Voucher fully redeemed');
            }
          } else {
            res.status(400).json({ message: 'Voucher quantity is already 0' });
            return;
          }
        } else {
          res.status(404).json({ message: 'Voucher not found in customer inventory' });
          return;
        }
      }
    }

    // Save the updated transaction
    await transaction.save();

    res.status(200).json({
      message: 'Voucher transaction redeemed and quantity updated successfully',
      transaction: {
        id: transaction.id,
        redeemed: transaction.redeemed, // Return the updated redeemed status
        customerId: transaction.customerId,
        voucherId: transaction.voucherId,
      },
    });
  } catch (error) {
    console.error('Error updating voucher transaction status:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};






export const getVoucherTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { listing_id } = req.params;
    const { used } = req.query; // Get the 'used' query parameter

    // Convert listing_id to a number
    const voucherIdNum = parseInt(listing_id, 10);
    if (isNaN(voucherIdNum)) {
      res.status(400).json({ message: 'Invalid listing_id' });
      return;
    }

    // Fetch transactions with the voucher relationship, applying the used filter
    const transactions = await Voucher_transaction.find({
      where: {
        voucherId: voucherIdNum,
        ...(used === 'true' ? { used: true } : used === 'false' ? { used: false } : {}),
      },
      relations: ['voucher'],
    });

    // If there are no transactions, return an empty array
    if (transactions.length === 0) {
      res.status(200).json({ transactions: [], message: 'No transactions found for this voucher.' });
      return;
    }

    const customers = await Customer_account.find(); // Fetch all customers
    const customerMap = customers.reduce((acc, customer) => {
      acc[customer.id] = customer.fullName;
      return acc;
    }, {});

    const response = transactions.map(transaction => ({
      id: transaction.id,
      voucherId: transaction.voucher.listing_id,
      voucherName: transaction.voucher.name,
      customerId: transaction.customerId,
      customerName: customerMap[transaction.customerId] || 'Unknown',
      purchaseDate: transaction.purchaseDate,
      expirationDate: transaction.voucher.expirationDate.toISOString(),
      amountSpent: transaction.voucher.discountedPrice,
      gemSpent: transaction.gems_spent,
      redeemed: transaction.redeemed,
      used: transaction.used,
    }));

    res.status(200).json({ transactions: response });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const updateOutletSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Convert outletId to a number
    const outletId = parseInt(req.params.outletId, 10);
    const { hasSubscriptionPlan } = req.body;

    // Check if outletId is a valid number
    if (isNaN(outletId)) {
      res.status(400).json({ message: "Invalid outlet ID" });
      return;
    }

    const outlet = await Outlet.findOne({
      where: { outlet_id: outletId }, // Use numeric outlet_id
      relations: ["business"],
    });

    if (!outlet) {
      res.status(404).json({ message: "Outlet not found" });
      return;
    }

    outlet.hasSubscriptionPlan = hasSubscriptionPlan;
    await outlet.save();

    res.status(200).json({ message: 'Outlet subscription status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating outlet subscription status' });
  }
};



export const updateHasSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { hasSubscriptionPlan } = req.body;
    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["business"],
    });

    if (!businessAccount) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    const business = businessAccount.business;

    business.hasSubscriptionPlan = hasSubscriptionPlan;
    await business.save();
    res.status(200).json({ message: 'Subscription status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating subscription status' });
  }
}


export const editSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      relations: ["business_register_business"],
    });

    if (!currentSubscription) {
      res.status(404).json({ status: 404, message: "Subscription not found" });
      return;
    }

    // Check if attempting to downgrade
    if (
      duration < currentSubscription.duration ||
      distance_coverage < currentSubscription.distance_coverage
    ) {
      res
        .status(400)
        .json({ status: 400, message: "Downgrading is not allowed" });
      return;
    }

    // Calculate total gems needed
    const total_gem =
      pricing.base[duration].gems +
      (pricing.extra[distance_coverage]?.gems || 0);

    // Fetch business account
    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["business"],
    });

    if (!businessAccount) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    // Check gem balance
    if (businessAccount.gem_balance < total_gem) {
      res
        .status(400)
        .json({ status: 400, message: "Not enough gems in the account" });
      return;
    }

    // Deduct gems
    businessAccount.gem_balance -= total_gem;
    const businessTransaction = Business_transaction.create({
      gems_deducted: total_gem,
      business_account: businessAccount,
    });
    await businessTransaction.save();
    await businessAccount.save();

    // Update subscription details
    currentSubscription.duration = duration;
    currentSubscription.distance_coverage = distance_coverage;
    currentSubscription.total_cost =
      pricing.base[duration].price +
      (pricing.extra[distance_coverage]?.price || 0);
    currentSubscription.total_gem = total_gem;
    currentSubscription.title = `${duration} Month Plan`;
    currentSubscription.description = `Subscription for ${duration} month(s) with ${distance_coverage} km coverage.`;

    // Update the expiration date
    currentSubscription.expiration_date = addMonths(
      new Date(currentSubscription.activation_date),
      duration
    );

    // Save the updated subscription
    const savedSubscription = await currentSubscription.save();
    console.log("Updated Subscription:", savedSubscription); // Log the updated subscription

    // Respond with the updated subscription
    res.status(200).json(savedSubscription);
  } catch (error) {
    console.error("Error editing subscription:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

export const createSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const total_gem = parseInt(
      pricing.base[duration].gems +
      (pricing.extra[distance_coverage]?.gems || 0) * duration
    );

    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["business"],
    });

    if (!businessAccount) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    console.log("Current gem balance:", businessAccount.gem_balance);
    console.log("Total gems to spend:", total_gem);

    if (businessAccount.gem_balance < total_gem) {
      res
        .status(400)
        .json({ status: 400, message: "Not enough gems in the account" });
      return;
    }

    businessAccount.gem_balance -= total_gem;
    const businessTransaction = Business_transaction.create({
      gems_deducted: total_gem,
      business_account: businessAccount,
    });
    await businessTransaction.save();
    await businessAccount.save();

    const businessAccountSubscription = BusinessAccountSubscription.create({
      duration,
      distance_coverage,
      total_cost:
        pricing.base[duration].price +
        (pricing.extra[distance_coverage]?.price || 0) * duration,
      total_gem,
      title: `${duration} Month Plan`,
      description: `Subscription for ${duration} month(s) with ${distance_coverage} km coverage.`,
      business_register_business: businessAccount.business, // Use the correct property name
    });

    await businessAccountSubscription.save();

    res.status(201).json(businessAccountSubscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const endSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;
    const { outlet_id } = req.body; // Assuming outlet_id is sent in the request body

    // Find the business account by username
    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["business"],
    });

    if (!businessAccount) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    const business = businessAccount.business;

    // Find the subscription based on outlet_id and ensure it's active (not ended yet)
    const subscription = await BusinessAccountSubscription.findOne({
      where: {
        business_register_business: business,
        outlet: { outlet_id },
        status: "active", // Ensure subscription is still active
      },
    });

    if (!subscription) {
      res.status(404).json({
        status: 404,
        message: "Subscription not found or already ended",
      });
      return;
    }

    // Mark the subscription as ended (soft delete by setting the ended flag)
    subscription.status = "deleted";
    await subscription.save();

    res
      .status(200)
      .json({ status: 200, message: "Subscription ended successfully" });
  } catch (error) {
    console.error("Error ending subscription:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const createOutletSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, outletId } = req.params;
    const {
      duration,
      distance_coverage,
      total_cost,
      total_gem,
      title,
      description,
    } = req.body;

    console.log("Incoming request data:", {
      username,
      outletId,
      duration,
      distance_coverage,
      total_cost,
      total_gem,
      title,
      description,
    });

    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["business"],
    });

    if (!businessAccount) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    const outlet = await Outlet.findOne({
      where: { outlet_id: parseInt(outletId, 10) },
    });

    if (!outlet) {
      res.status(404).json({ status: 404, message: "Outlet not found" });
      return;
    }

    const business = businessAccount.business;
    businessAccount.gem_balance -= total_gem;
    const businessTransaction = Business_transaction.create({
      gems_deducted: total_gem,
      business_account: businessAccount,
    });
    await businessTransaction.save();
    await businessAccount.save();

    const activationDate = new Date();

    let expirationDate = new Date(activationDate);
    expirationDate.setMonth(activationDate.getMonth() + duration);

    if (expirationDate.getDate() !== activationDate.getDate()) {
      expirationDate.setDate(0);
    }

    // Log dates for debugging
    console.log("Activation Date:", activationDate);
    console.log("Final Expiration Date:", expirationDate);

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
      outlet: outlet,
    });

    await businessAccountSubscription.save();

    const formattedActivationDate = activationDate.toLocaleDateString("en-US");
    const formattedExpirationDate = expirationDate.toLocaleDateString("en-US");

    res.status(201).json({
      message: "Subscription created successfully",
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
        outlet: outlet,
      },
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const checkExpiringSubscription = async (): Promise<void> => {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );
  const lastThreeDays = new Date();

  /*
    const oneWeekFromNow = new Date(); //assuming Now is current date before expiration
    const eightDaysFromNow = new Date(today);
    oneWeekFromNow.setDate(today.getDate() + 7);
    eightDaysFromNow.setDate(today.getDate() + 8); // Create a 1-day range for timezone differences
    */

  // Get the date exactly 7 days from now (time set to 00:00:00) to disregard the time and only compare by date.
  const oneWeekFromNow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 7
  );
  // Create a date for 8 days from now to provide a range (time set to 23:59:59 for the end of the day)
  const eightDaysFromNow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 8
  );
  eightDaysFromNow.setHours(23, 59, 59, 999); // Set time to the end of the day

  //lastThreeDays.setDate(today.getDate() + 3);

  try {
    // Find subscriptions expiring within the next week
    const expiringSubscriptions = await BusinessAccountSubscription.find({
      where: {
        //expiration_date: Between(oneWeekFromNow, eightDaysFromNow), //1 week from expiry, only send once.
        expiration_date: Between(todayStart, oneWeekFromNow), // Check if expiration is within the 1-week range, continuosly send within the range
        status: "active", // Only send emails for active subscriptions
      },
      relations: [
        "business_register_business",
        "business_register_business.business_account",
      ], // Load related business for email
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

cron.schedule('*/20 * * * * *', async () => {
  console.log('Running automatic subscription renewal job...');

  try {
    const expiringSubscriptions = await BusinessAccountSubscription.find({
      where: {
        expiration_date: LessThanOrEqual(new Date()), // Check for expired subscriptions
        autoRenew: true, // Only fetch subscriptions marked for auto-renewal
      },
      relations: ['business_register_business', 'business_register_business.business_account'], // Ensure the necessary relations are fetched
    });

    console.log(`Found ${expiringSubscriptions.length} expiring subscriptions for auto-renewal`);
    for (const subscription of expiringSubscriptions) {

      // Ensure that business_register_business and business_account exist
      if (!subscription.business_register_business || !subscription.business_register_business.business_account) {
        console.log(`Missing business_register_business or business_account for subscription: ${subscription.subscription_id}`);
        continue; // Skip this subscription
      }

      const businessAccount = subscription.business_register_business.business_account;

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

      // Calculate total gems needed for renewal
      const total_gem = pricing.base[subscription.duration].gems +
        (pricing.extra[subscription.distance_coverage]?.gems || 0) * subscription.duration;

      // Check if the business account has enough gems for renewal
      if (businessAccount.gem_balance >= total_gem) {
        // Deduct gem balance
        businessAccount.gem_balance -= total_gem;
        const businessTransaction = Business_transaction.create({
          gems_deducted: total_gem,
          business_account: businessAccount,
        });
        await businessTransaction.save();
        await businessAccount.save();

        // Extend expiration date
        const newExpirationDate = new Date(subscription.expiration_date);
        newExpirationDate.setMonth(newExpirationDate.getMonth() + subscription.duration);
        subscription.expiration_date = newExpirationDate;

        await subscription.save();
        console.log(`Subscription ${subscription.subscription_id} renewed successfully`);
      } else {
        console.log(`Not enough gems to renew subscription ${subscription.subscription_id}. Sending notification...`);

      }
    }
  } catch (error) {
    console.error('Error during automatic subscription renewal:', error);
  }
});





export const updateSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, subscription_id, duration, distance_coverage, autoRenew } = req.body;

    console.log('Request body:', req.body);

    // Find the subscription by subscription_id
    const existingSubscription = await BusinessAccountSubscription.findOne({
      where: { subscription_id },
    });

    if (!existingSubscription) {
      console.log(`No subscription found with subscription_id: ${subscription_id}`);
      res.status(404).json({ status: 404, message: 'No subscription found to update' });
      return;
    }

    console.log('Found existing subscription:', existingSubscription);

    // Check if the request includes a username, and if it matches the subscription owner
    const associatedBusiness = await Business_account.findOne({ where: { username } });
    if (!associatedBusiness) {
      console.log(`Unauthorized attempt by user ${username}`);
      res.status(401).json({ status: 401, message: 'Unauthorized' });
      return;
    }

    // Update subscription fields
    if (duration) existingSubscription.duration = duration;
    if (distance_coverage) existingSubscription.distance_coverage = distance_coverage;
    if (autoRenew !== undefined) existingSubscription.autoRenew = autoRenew;
    associatedBusiness.min_gem_balance += Math.floor(existingSubscription.total_gem);
    await associatedBusiness.save()

    // Save the updated subscription
    await existingSubscription.save();

    console.log('Subscription successfully updated:', existingSubscription);

    res.status(200).json({
      status: 200,
      message: 'Subscription successfully updated',
      subscription: existingSubscription,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ status: 500, message: 'Internal Server Error', error: error.message });
  }
};





export const renewSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, outlet_id, duration, distance_coverage } = req.body;

    console.log('Request body:', req.body);

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
      console.log(`Business account with username "${username}" not found.`);
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    console.log('Found business account:', businessAccount);

    if (businessAccount.gem_balance < total_gem) {
      res.status(400).json({ status: 400, message: 'Not enough gems to renew subscription' });
      return;
    }

    // Find the existing subscription by outlet ID (or main subscription)
    const existingSubscription = await BusinessAccountSubscription.findOne({
      where: {
        business_register_business: businessAccount.business,
        outlet: outlet_id || null,
        status: 'active'
      },
      relations: ['business_register_business']
    });

    if (!existingSubscription) {
      console.log(
        `No existing subscription found for outlet_id: ${outlet_id} and business: ${businessAccount.business}`
      );
      res.status(404).json({
        status: 404,
        message: "No existing subscription found to renew",
      });
      return;
    }

    console.log('Found existing subscription:', existingSubscription);

    const currentDate = new Date();
    let newExpirationDate = new Date(existingSubscription.expiration_date);

    // If the current date is after the expiration date, start from current date
    if (currentDate > newExpirationDate) {
      newExpirationDate = new Date(currentDate);
    }


    newExpirationDate.setMonth(newExpirationDate.getMonth() + duration);

    console.log('New expiration date calculated:', newExpirationDate);


    businessAccount.gem_balance -= total_gem;

    await businessAccount.save();

    existingSubscription.activation_date = currentDate;
    existingSubscription.expiration_date = newExpirationDate;
    existingSubscription.duration = duration;
    existingSubscription.distance_coverage = distance_coverage;
    existingSubscription.total_gem = total_gem;

    console.log('Saving updated subscription:', existingSubscription);
    await existingSubscription.save();
    console.log('Subscription successfully renewed:', existingSubscription);
    const savedSubscription = await existingSubscription.save();
    console.log('Subscription saved in DB:', savedSubscription);

    res.status(200).json({
      status: 200,
      message: "Subscription successfully renewed",
      subscription: existingSubscription,
    });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};




export const viewSubscription = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username } = req.params;

    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["business"],
    });

    if (!businessAccount) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    const business = businessAccount.business;
    const subscriptions = await BusinessAccountSubscription.find({
      where: {
        business_register_business: business,
        status: "active",
      },
      relations: ["outlet"],
    });

    // Return an empty array if no active subscriptions are found, instead of a 404
    if (!subscriptions.length) {
      res.status(200).json({ status: 200, subscriptions: [] });
      return;
    }

    const formattedSubscriptions = subscriptions.map((subscription) => ({
      ...subscription,
      outlet_id: subscription.outlet ? subscription.outlet.outlet_id : null,
    }));

    res
      .status(200)
      .json({ status: 200, subscriptions: formattedSubscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const createAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    const isUsernameAlreadyInUse = await Business_account.findOneBy({
      username,
    });

    if (isUsernameAlreadyInUse) {
      res.status(400).json({
        status: 400,
        message: "Username already in use",
      });
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and expiration time
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10); // Hash OTP for security
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    const business = Business_account.create({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      email,
      otp: hashedOTP,
      otpExpiresAt,
      banStatus: false,
      banRemarks: "",
    });

    await business.save();

    // Send OTP to the user's email
    await sendOTPEmail(email, otp);

    const token = jwt.sign(
      {
        id: business.business_id,
        username: business.username,
        role: business.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      business,
      token,
    });
  } catch (error) {
    console.error("Error creating account:", error);

    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { otp, userId } = req.body;

    const businessAccount = await Business_account.findOne({
      where: { business_id: userId },
    });

    if (!businessAccount) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    // Check if the OTP is expired
    if (
      businessAccount.otpExpiresAt &&
      businessAccount.otpExpiresAt < new Date()
    ) {
      res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
      return;
    }

    // Verify the OTP
    const isOTPValid = await bcrypt.compare(otp, businessAccount.otp);
    if (!isOTPValid) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    // Clear the OTP and mark account as verified
    businessAccount.otp = "";
    businessAccount.otpExpiresAt = null;

    await businessAccount.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const businessAccount = await Business_account.findOne({
      where: { business_id: userId },
    });

    if (!businessAccount) {
      res.status(404).json({ message: "Account not found" });
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

    res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        status: 400,
        message: "Username and password are required",
      });
      return;
    }

    const business = await Business_account.findOneBy({ username });

    if (!business) {
      res.status(401).json({
        status: 401,
        message: "Invalid username or password",
      });
      return;
    }

    // Check if the account is soft-deleted
    if (business.deletedAt) {
      res.status(403).json({ message: "This account has been deactivated." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, business.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 401,
        message: "Invalid username or password",
      });
      return;
    }

    const isEmailVerified = !business.otp; // If OTP is null or empty, the email is verified

    const token = jwt.sign(
      {
        id: business.business_id,
        username: business.username,
        role: business.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
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
      message: "Internal server error",
    });
  }
};

export const logoutAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // this part needs to probably implement middleware for authentication such that
    // the person who login is the one who logout

    res.status(200).json({
      status: 200,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
};

export const retrieveProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    //const { username } = req.params;
    const username = (req as any).user.username;

    if (!username) {
      res.status(400).json({
        status: 400,
        message: "Username is required",
      });
      return;
    }

    // Find the business account by username and include related outlets
    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ["outlets", "business", "transactions"], // Assuming the relation is called 'outlets' in your entity
    });

    if (!businessAccount) {
      res.status(404).json({
        status: 404,
        message: "User not found",
      });
      return;
    }

    // Filter out deleted outlets
    const activeOutlets = businessAccount.outlets.filter(outlet => !outlet.isDeleted);

    res.json({
      status: 200,
      business: {
        firstName: businessAccount.firstName,
        lastName: businessAccount.lastName,
        email: businessAccount.email,
        username: businessAccount.username,
        profileImage: businessAccount.profileImage, // Return image path
        gem_balance: businessAccount.gem_balance,
        min_gem_balance: businessAccount.min_gem_balance,
        banStatus: businessAccount.banStatus,
        banRemarks: businessAccount.banRemarks,
        transactions: businessAccount.transactions
      },
      outlets: activeOutlets,
      registeredBusiness: businessAccount.business,
    });
  } catch (error) {
    console.error("Error retrieving profile:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Function to update profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    //const { username } = req.params;
    const username = (req as any).user.username;
    const { firstName, lastName, email } = req.body;

    if (!username) {
      res.status(400).json({
        status: 400,
        message: "Username is required",
      });
      return;
    }

    if (!firstName && !lastName && !email) {
      res.status(400).json({
        status: 400,
        message:
          "At least one field (firstName, lastName, or email) is required to update",
      });
      return;
    }

    const business = await Business_account.findOneBy({ username });

    if (!business) {
      res.status(404).json({
        status: 404,
        message: "User not found",
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
      message: "Profile updated successfully",
      data: business,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};

export const uploadProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        message: "Profile Image is required",
      });
      return; // Exit the function early if no file is provided
    }

    const businessAccount = await Business_account.findOneBy({ username });
    if (!businessAccount) {
      res.status(400).json({
        status: 400,
        message: "Business Account not found",
      });
      return;
    }

    //const imagePath = req.file.path;  // Path of the uploaded file
    //businessAccount.profileImage = imagePath;  // store the file path or URL.
    const fileName = req.file.filename; // Get the file name
    businessAccount.profileImage = `uploads/profileImages/${fileName}`; // Save relative path in DB
    await businessAccount.save();

    res.status(200).json({
      message: "Profile image uploaded successfully",
      imagePath: businessAccount.profileImage,
    });
  } catch (error) {
    console.log(error);

    res.status(400).json({
      status: 400,
      message: error.message.toString(),
    });
  }
};

// For registering their business after the creation of account
export const registerBusiness = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const username = (req as any).user.username;
    const {
      entityName,
      location,
      category,
    } = req.body;
    console.log("Request body: ", req.body);
    console.log("Request file: ", req.file);

    const isUsernameAlreadyInUse = await Business_register_business.findOneBy({
      entityName,
    });

    if (isUsernameAlreadyInUse) {
      res.status(400).json({
        status: 400,
        message: "Business EntityName already in use",
      });
      return; // Add this to prevent further execution
    }

    // Check if req.file is defined
    if (!req.file) {
      res.status(400).json({
        status: 400,
        message: "Proof file (image or PDF) is required",
      });
      return; // Add this to prevent further execution
    }

    const businessAccount = await Business_account.findOneBy({ username });
    if (!businessAccount) {
      res.status(400).json({
        status: 400,
        message: "Business Account not found",
      });
      return; // Add this to prevent further execution
    }

    const registeredBusiness = Business_register_business.create({
      entityName,
      location,
      category,
      proof: `uploads/proofOfBusiness/${req.file.filename}`,
      status: "pending",
      remarks: "",
      business_account: businessAccount,
    });

    await registeredBusiness.save();

    res.json({
      registeredBusiness,
    });
  } catch (error) {
    console.log(error);

    res.status(400).json({
      status: 400,
      message: error.message.toString(),
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

export const retrieveRegisterBusiness = async (req: Request, res: Response): Promise<void> => {

  try {
    const { registration_id } = req.params;

    const businessRegistrationIdNum = parseInt(registration_id, 10);
    if (isNaN(businessRegistrationIdNum)) {
      res.status(400).json({ message: 'Invalid business_registration_id' });
      return;
    }

    // Find the registered business associated with the business account
    const registeredBusiness = await Business_register_business.findOne({
      where: { registration_id: businessRegistrationIdNum },
    });

    if (!registeredBusiness) {
      res.status(404).json({ message: 'Registered business not found' });
      return;
    }

    // Send the registered business data as a response
    res.status(200).json(registeredBusiness);
  } catch (error) {
    console.error('Error retrieving registered business:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const createOutlet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    //const { username } = req.params;
    const username = (req as any).user.username;
    const { outlet_name, location, contact, description } = req.body;

    console.log(username);

    const business = await Business_account.findOneBy({ username });
    if (!business) {
      res
        .status(404)
        .json({ status: 404, message: "Business account not found" });
      return;
    }

    if (!business) {
      res.status(404).json({ status: 404, message: 'Business account not found' });
      return;
    }
    const newOutlet = Outlet.create({
      outlet_name,
      location,
      contact,
      description,
      business,
    });

    await newOutlet.save();

    res.status(201).json(newOutlet);
  } catch (error) {
    console.error("Error creating outlet:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
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

    const outlet = await Outlet.findOne({
      where: {
        outlet_id: outletIdNum,
        isDeleted: false // Only retrieve non-deleted outlets
      }
    });
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
/*
export const retrieveOutletsByRegistrationId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registration_id } = req.params;

        // Ensure registration_id is a valid number
        const registrationIdNum = parseInt(registration_id, 10);
        if (isNaN(registrationIdNum)) {
            res.status(400).json({ message: 'Invalid registration_id' });
            return;
        }

        // Use getRepository to retrieve the Business_register_business
        
        const business = await Business_register_business.findOne({
            where: { registration_id: registrationIdNum },
            relations: ['outlets'] // Include outlets in the response
        });

        if (!business) {
            res.status(404).json({ message: 'Business not found' });
            return;
        }

        // Return the outlets associated with the found business
        res.status(200).json(business.outlets);
    } catch (error) {
        console.error('Error retrieving outlets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
*/
export const editOutlet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { outlet_id } = req.params;
    const updatedData = req.body;
    //console.log('EditOutlet - Updated data:', updatedData);
    const outletIdNum = parseInt(outlet_id, 10);
    if (isNaN(outletIdNum)) {
      res.status(400).json({ message: 'Invalid outlet_id' });
      return;
    }

    const outlet = await Outlet.findOne({
      where: {
        outlet_id: outletIdNum,
        isDeleted: false // Only edit non-deleted outlets
      }
    });
    if (!outlet) {
      res.status(404).json({ message: 'Outlet not found' });
      return;
    }

    // Update outlet fields based on the provided data
    outlet.outlet_name = updatedData.outlet_name;
    outlet.location = updatedData.location;
    outlet.description = updatedData.description;
    outlet.contact = updatedData.contact;

    await outlet.save();

    res.status(200).json({ message: 'Outlet updated successfully', outlet: outlet });
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
    const outlet = await Outlet.findOne({
      where: { outlet_id: outletID },
      relations: ['business_account_subscription', 'vouchers', 'items']
    });

    if (!outlet) {
      res.status(404).json({
        status: 404,
        message: 'Outlet not found',
      });
      return;
    }

    // Soft delete the outlet
    outlet.isDeleted = true;
    await outlet.save();

    // Soft delete related subscriptions
    if (outlet.business_account_subscription && outlet.business_account_subscription.length > 0) {
      await Promise.all(outlet.business_account_subscription.map(async (subscription) => {
        subscription.status = "deleted";
        await subscription.save();
      }));
    }

    // Soft delete related vouchers
    if (outlet.vouchers && outlet.vouchers.length > 0) {
      await Promise.all(outlet.vouchers.map(async (voucher) => {
        voucher.isDeleted = true;
        await voucher.save();
      }));
    }

    // // Remove association between outlet and items
    // if (outlet.items && outlet.items.length > 0) {
    //   await Promise.all(outlet.items.map(async (item) => {
    //     item.outlet = null;
    //     await item.save();
    //   }));
    // }

    res.json({
      status: 200,
      message: 'Outlet deleted successfully, related subscriptions marked as deleted and associations removed',
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
    const { name, description, price, discount, duration,
      business_id, outlet_id,
      enableGroupPurchase, groupSize, groupDiscount, reward_item_id
    } = req.body;
    const username = (req as any).user.username;

    const businessAccount = await Business_account.findOne({ where: { username }, relations: ['business', 'outlets'] });
    if (!businessAccount) {
      res.status(404).json({ message: 'Business account not found' });
      return;
    }

    // Check if req.file is defined
    if (!req.file) {
      res.status(400).json({
        status: 400,
        message: 'Voucher image is required'
      });
      return; // Exit the function early if no file is provided
    }

    // Create a new voucher listing
    const newVoucher = Business_voucher.create({
      name,
      description,
      price,
      discount,
      duration,
      voucherImage: `uploads/vouchers/${req.file.filename}`, // store relative path
      groupPurchaseEnabled: enableGroupPurchase,
      groupSize,
      groupDiscount,
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

    // If reward_item_id is provided, associate with reward item
    if (reward_item_id) {
      const rewardItem = await Item.findOne({ where: { id: reward_item_id } });
      if (!rewardItem) {
        res.status(404).json({ message: 'Reward item not found' });
        return;
      }
      newVoucher.rewardItem = rewardItem;
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
    const { registration_id, outlet_id, searchTerm } = req.query;
    //console.log('Received registration_id:', registration_id);
    //console.log('Received outlet_id:', outlet_id);
    let vouchers;
    const query = Business_voucher.createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.rewardItem', 'rewardItem')
      .leftJoinAndSelect('voucher.business_register_business', 'business')
      .leftJoinAndSelect('voucher.outlet', 'outlet');

    // Apply search term if present
    if (searchTerm) {
      query.andWhere('(voucher.name ILIKE :search OR voucher.description ILIKE :search)', {
        search: `%${searchTerm}%`
      });
    }

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
      /*
      vouchers = await Business_voucher.find({
          where: { business_register_business: business, outlet: IsNull() },
          relations: ['business_register_business']
      });
      */

      // Filter vouchers for the main business without an outlet
      query.andWhere('voucher.business_register_business = :registrationId', { registrationId: registrationIdNum });
      query.andWhere('voucher.outlet IS NULL'); // Ensure only vouchers without outlets are included

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
      /*
      vouchers = await Business_voucher.find({ where: { outlet: outlet }, relations: ['outlet'] });
      */
      // Filter vouchers for the specific outlet
      query.andWhere('voucher.outlet = :outletId', { outletId: outletIdNum });

    } else {
      res.status(400).json({ message: 'Please provide either business_id or outlet_id' });
      return;
    }

    query.andWhere('voucher.isDeleted = :isDeleted', { isDeleted: false });

    // Fetch the vouchers
    vouchers = await query.getMany();

    // If no vouchers are found
    if (!vouchers || vouchers.length === 0) {
      res.status(200).json({ message: 'No vouchers found', vouchers: [] });
      return;
    }

    // Respond with the vouchers
    res.status(200).json({ vouchers });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { listing_id } = req.params;
    console.log("Received listing_id:", listing_id);

    const voucherIdNum = parseInt(listing_id, 10);
    if (isNaN(voucherIdNum)) {
      res.status(400).json({ message: "Invalid listing_id" });
      return;
    }

    const voucher = await Business_voucher.findOne({
      where: { listing_id: voucherIdNum, isDeleted: false },
      relations: ["business_register_business", "outlet", "rewardItem"],
    });

    if (!voucher) {
      res.status(404).json({ message: "Voucher not found" });
      return;
    }

    res.status(200).json({ voucher });
  } catch (error) {
    console.error("Error fetching voucher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { listing_id } = req.params;
    const updatedData = req.body; // Ensure you're sending the correct fields from the frontend

    const voucherIdNum = parseInt(listing_id, 10);
    if (isNaN(voucherIdNum)) {
      res.status(400).json({ message: "Invalid listing_id" });
      return;
    }

    const voucher = await Business_voucher.findOne({
      where: { listing_id: voucherIdNum, isDeleted: false },
      relations: ['rewardItem'],
    });
    if (!voucher) {
      res.status(404).json({ message: "Voucher not found" });
      return;
    }

    // Update voucher fields based on the provided data
    voucher.name = updatedData.name;
    voucher.description = updatedData.description;
    voucher.price = updatedData.price;
    voucher.discount = updatedData.discount;
    voucher.voucherImage = updatedData.voucherImage;


    // Update reward item if provided, or unequip if null
    if (updatedData.reward_item_id) {
      const rewardItem = await Item.findOne({ where: { id: updatedData.reward_item_id } });
      if (!rewardItem) {
        res.status(404).json({ message: 'Reward item not found' });
        return;
      }
      voucher.rewardItem = rewardItem;
    } else {
      // Unequip the reward item by setting it to null
      voucher.rewardItem = null;
    }

    await voucher.save();

    res.status(200).json({ message: "Voucher updated successfully", voucher });
  } catch (error) {
    console.error("Error updating voucher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteVoucher = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { listing_id } = req.params;

    const voucherIdNum = parseInt(listing_id, 10);
    if (isNaN(voucherIdNum)) {
      res.status(400).json({ message: "Invalid listing_id" });
      return;
    }

    // Find the voucher by listing_id
    const voucher = await Business_voucher.findOne({
      where: { listing_id: voucherIdNum, isDeleted: false },
    });
    if (!voucher) {
      res.status(404).json({ message: "Voucher not found" });
      return;
    }

    // Soft delete the voucher
    voucher.isDeleted = true;
    await voucher.save();

    res.status(200).json({ message: "Voucher deleted successfully" });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchVouchers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { registration_id, outlet_id, searchTerm } = req.query;

    let vouchers;
    const query = Business_voucher.createQueryBuilder("voucher");

    if (searchTerm) {
      query.andWhere(
        "(voucher.name ILIKE :search OR voucher.description ILIKE :search)",
        {
          search: `%${searchTerm}%`,
        }
      );
    }

    if (registration_id) {
      query.andWhere("voucher.business_register_business = :registration_id", {
        registration_id,
      });
    }

    if (outlet_id) {
      query.andWhere("voucher.outlet = :outlet_id", { outlet_id });
    }

    query.andWhere("voucher.isDeleted = :isDeleted", { isDeleted: false });

    vouchers = await query.getMany();

    if (vouchers.length === 0) {
      res.status(404).json({ message: "No vouchers found" });
      return;
    }

    res.status(200).json({ vouchers });
    return;
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user.id; // Get user from JWT token
    const { password } = req.body;

    const businessAccount = await Business_account.findOne({
      where: { business_id: userId },
      relations: ["business", "outlets"], //relations for delete
    });
    console.log("Business Account found:", businessAccount); // Log the account found

    if (!businessAccount) {
      res.status(404).json({ message: "Account not found" });
      return;
    }

    // Confirm the password
    if (!(await bcrypt.compare(password, businessAccount.password))) {
      res.status(401).json({ message: "Invalid password" });
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
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyTopUpBusiness = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { paymentIntentId, gemsAdded } = req.body;

    if (!paymentIntentId || !gemsAdded || gemsAdded <= 0) {
      res
        .status(400)
        .json({ success: false, message: "Invalid request parameters" });
      return;
    }

    // Retrieve the PaymentIntent from Stripe to verify payment status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      res
        .status(400)
        .json({ success: false, message: "Payment not completed or failed" });
      return;
    }

    // Retrieve user from JWT token
    const userId = (req as any).user.id;
    const businessAccount = await Business_account.findOne({
      where: { business_id: userId },
    });

    if (!businessAccount) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    // Check if this payment intent has already been processed
    const transactionExists = await Business_transaction.findOne({
      where: { stripe_payment_intent_id: paymentIntentId },
    });
    if (transactionExists) {
      res.status(400).json({
        success: false,
        message: "This payment has already been processed.",
      });
      return;
    }

    // Add the gems to the business account balance
    const currentGemBalance = parseFloat(
      businessAccount.gem_balance.toString()
    );
    const newGemBalance = currentGemBalance + gemsAdded;

    // Update the balance and save
    businessAccount.gem_balance = parseFloat(newGemBalance.toFixed(2));
    await businessAccount.save();

    // Log the transaction in the business transaction table
    const currencyDollars = paymentIntent.amount_received / 100; // Stripe provides amount in cents
    const businessTransaction = Business_transaction.create({
      currency_amount: currencyDollars,
      gems_added: gemsAdded,
      business_account: businessAccount,
      stripe_payment_intent_id: paymentIntent.id, // Store PaymentIntent ID to ensure idempotency
    });
    await businessTransaction.save();

    // Respond with the updated balance
    res.status(200).json({
      success: true,
      message: "Gems topped up successfully",
      balance: businessAccount.gem_balance,
    });
    return;
  } catch (error) {
    console.error("Error verifying payment and topping up gems:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getItemsByBusinessAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    // Find the business account
    const businessAccount = await Business_account.findOne({
      where: { username },
      relations: ['business', 'outlets']
    });

    if (!businessAccount) {
      res.status(404).json({ message: 'Business account not found' });
      return;
    }

    // Get items associated with the main business
    const businessItems = await Item.find({
      where: { business_register_business: businessAccount.business },
      relations: ['business_register_business']
    });

    // Get items associated with all outlets
    const outletItems = await Item.createQueryBuilder('item')
      .innerJoinAndSelect('item.outlet', 'outlet')
      .where('outlet.business = :businessId', { businessId: businessAccount.business_id })
      .getMany();

    // Combine all items
    const allItems = [...businessItems, ...outletItems];

    res.status(200).json(allItems);
  } catch (error) {
    console.error('Error fetching items for business account:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

