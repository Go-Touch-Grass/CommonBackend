import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import express from "express";
import path from 'path';
import { Admin } from "./entities/Admin";
import bcrypt from "bcrypt";

import { Customer_account } from "./entities/Customer_account";
import { adminRouter } from "./routes/admin";

import { customerAccountRouter } from "./routes/customer_account_router";
import { Business_register_business } from "./entities/Business_register_business";

import { Outlet } from "./entities/Outlet";
import { Business_account } from "./entities/Business_account"; // Add this line
import { businessRouter } from "./routes/business";
import { BusinessAccountSubscription } from "./entities/Business_account_subscription";
import Stripe from 'stripe';
import { paymentRouter } from "./routes/payment";
import { Business_transaction } from "./entities/Business_transaction";
import { Item, ItemType } from "./entities/Item";
import { Avatar } from "./entities/Avatar";
import { itemRouter } from "./routes/item_router";
import { avatarRouter } from "./routes/avatar_router";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
        Admin,
        Business_account,
        Business_register_business,
        Customer_account,
        Outlet,
        BusinessAccountSubscription,
        Business_transaction,
        Item,
        Avatar
    ],
    synchronize: true,
});

const app = express();
//const cors = require("cors");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export { stripe };

const main = async () => {
    try {
        await AppDataSource.initialize()
            .then(async () => {
                const adminRepository = AppDataSource.getRepository(Admin);

                // Check if admin user already exists
                const existingAdmin = await adminRepository.findOneBy({
                    username: "admin",
                });

                if (!existingAdmin) {
                    const password = 'password';
                    const hashedPassword = await bcrypt.hash(password, 10);

                    const admin = adminRepository.create({
                        username: 'admin',
                        password: hashedPassword,
                        name: 'admin',
                        role: 'admin'
                    });

                    await adminRepository.save(admin);
                    console.log("Admin user created");
                } else {
                    console.log("Admin user already exists");
                }
            })
            .catch((error) =>
                console.log("Error during Data Source initialization", error)
            );

        const initializeDefaultItems = async () => {
            const itemRepository = AppDataSource.getRepository(Item);

            const defaultItems = [
                { name: 'Baseball Cap', type: ItemType.HAT, filepath: 'https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/baseball_cap.png' },
                { name: 'Cowboy Hat', type: ItemType.HAT, filepath: 'https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/cowboy_hat.png' },
                { name: 'Love Shirt', type: ItemType.SHIRT, filepath: 'https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/love_shirt.png' },
                { name: 'White Shirt', type: ItemType.SHIRT, filepath: 'https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/white_shirt.png' },
                { name: 'Blue Skirt', type: ItemType.BOTTOMS, filepath: 'https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/blue_skirt.png' },
                { name: 'Purple Pants', type: ItemType.BOTTOMS, filepath: 'https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/purple_pants.png' },
            ];

            for (const item of defaultItems) {
                const existingItem = await itemRepository.findOne({ where: { name: item.name } });
                if (!existingItem) {
                    const newItem = itemRepository.create(item);
                    await itemRepository.save(newItem);
                    console.log(`Created default item: ${item.name}`);
                } else {
                    console.log(`Default item already exists: ${item.name}`);
                }
            }
        };

        await initializeDefaultItems();
        console.log("Default items initialized");

        const cors = require("cors");
        const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];
        app.use(
            cors({
                origin: function (origin, callback) {
                    // If origin is in the allowed origins list or if it's undefined (like in some local testing environments)
                    if (!origin || allowedOrigins.includes(origin)) {
                        callback(null, true);
                    } else {
                        callback(new Error("Not allowed by CORS"));
                    }
                },
            })
        );
        /*
        app.use(
            cors({
                origin: "http://localhost:3000",
            })
        );
        */

        console.log("Connected to Postgres");

        app.use(express.json());
        app.use(adminRouter);
        app.use(businessRouter);

        // Serve static files from the uploads folder
        const uploadsPath = path.join(__dirname, '../uploads'); // For relative path
        app.use('/uploads', express.static(uploadsPath));

        //app.use('/assets', express.static(path.join(__dirname, 'assets', 'sprites')));
        app.use(customerAccountRouter);
        app.use(paymentRouter);

        app.use(itemRouter);
        app.use(avatarRouter);

        app.listen(8080, () => {
            console.log("Now running on port 8080");
        });
    } catch (error) {
        console.error(error);
        throw new Error("Unable to connect to db");
    }
};

main();
