import express, { Request, Response } from "express";
import { Gem_test } from "../entities/Gem_test";
import { getConnection } from "typeorm";

const router = express.Router();


router.post("/api/top-up-gems/:businessId", async (req: Request, res: Response) => {
    const { amount } = req.body;
    const { businessId } = req.params;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    try {

        const gemTest = await Gem_test.findOne({ where: { business_account: { business_id: 1 } } });

        if (!gemTest) {
            return res.status(404).json({ message: "Gem account not found" });
        }


        await gemTest.topUp(amount);

        return res.status(200).json({ message: "Gems topped up successfully", balance: gemTest.balance });
    } catch (error) {
        console.error("Error topping up gems:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
