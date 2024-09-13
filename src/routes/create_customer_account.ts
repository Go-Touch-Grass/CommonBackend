import express from "express";
import { Customer_account } from "../entities/Customer_account";

const router = express.Router();

router.post("/api/Customer_account", async (req, res) => {
    const {
        username,
        password,
    } = req.body;

    const customer_account = Customer_account.create({
        username,
        password,
    });

    await customer_account.save();

    return res.json(customer_account);
});

export { router as createCustomerAccountRouter };