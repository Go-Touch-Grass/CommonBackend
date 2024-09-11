import express from "express";
import { Customer } from "../entities/Customer";

const router = express.Router();

router.post("/api/Customer", async (req, res) => {
    const {
        username,
        password,
        name
    } = req.body;

    const customer = Customer.create({
        username,
        password,
        name
    });

    await customer.save();

    return res.json(customer);
});

export { router as createCustomerRouter };