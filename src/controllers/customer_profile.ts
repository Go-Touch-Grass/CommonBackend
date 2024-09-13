import { Request, Response } from "express";
import { Customer_profile } from "../entities/Customer_profile";
import { Customer_account } from "../entities/Customer_account";

export const registerCustomerProfile = async (req: Request, res: Response) => {
    // Log incoming request params and body
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    const { customerId } = req.params;

    const {
        avatarname,
        profilepicture,
    } = req.body;

    // Check if customerId is being parsed correctly
    console.log("Parsed customerId:", customerId);

    const customer_account = await Customer_account.findOne({
        where: {
            id: parseInt(customerId),
        },
    });

    // Log whether the customer account was found
    if (!customer_account) {
        console.log("Customer account not found!");
        return res.json({
            msg: "Customer account not found!"
        });
    }

    const customer_profile = Customer_profile.create({
        avatarname,
        profilepicture,
    });

    // Attempt to save the profile
    try {
        await customer_profile.save();
        console.log("Customer profile created successfully");
    } catch (err) {
        console.error("Error saving customer profile:", err);
        return res.status(500).json({
            msg: "Failed to save customer profile"
        });
    }

    return res.json(customer_profile);
};
