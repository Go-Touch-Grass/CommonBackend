import express from "express";
import { Business } from "../entities/Business";

const router = express.Router();

router.post("/api/business", async (req, res) => {
    const {
        username,
        password,
        name
    } = req.body;

    const business = Business.create({
        username,
        password,
        name
    });

    await business.save();

    return res.json(business);
});

export { router as createBusinessRouter };