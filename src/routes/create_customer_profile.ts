import express from "express";
import { Customer_profile } from "../entities/Customer_profile";
import { Customer_account } from "../entities/Customer_account";


const router = express.Router();

router.post("/api/Customer_account/:Customer_accountId/Customer_profile", async (req, res) => {
    
    
    const{ Customer_accountId } = req.params

    const {
        avatarname,
        profilepicture,
    } = req.body;

    const customer_account = await Customer_account.findOne({
        where: {
            id: parseInt(Customer_accountId),
        },
    });

    if(!customer_account){
        return res.json({
            msg: "Customer account not found!"
        })
    }

    const customer_profile = Customer_profile.create({
        avatarname,
        profilepicture,
    });

    await customer_profile.save();

    return res.json(customer_profile);
});

export { router as createCustomerProfileRouter };