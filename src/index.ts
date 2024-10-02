import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import express from "express";
import path from 'path';
import { Admin } from "./entities/Admin";
import bcrypt from "bcrypt";
import { Business } from "./entities/Business";
import { Customer_account } from "./entities/Customer_account";
import { adminRouter } from "./routes/admin";
// import { businessRouter } from "./routes/business";
import { customerAccountRouter } from "./routes/customer_account_router";
import { Business_register_business } from "./entities/Business_register_business";

import { businessLoginAccountRouter } from "./routes/business_login_account";
import { businessLogoutAccountRouter } from "./routes/business_logout_account";
import { Outlet } from "./entities/Outlet";
import { Business_account } from "./entities/Business_account"; // Add this line
import { businessRegisterBusinessRouter } from "./routes/business_register_business";
import { businessCreateAccountRouter } from "./routes/business_create_account";
import { businessRetrieveAccountRouter } from "./routes/business_retrieve_profile";
import { businessEditAccountRouter } from "./routes/business_edit_profile";
import { businessCreateOutletRouter } from "./routes/business_create_outlet";
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
        Item,
        Avatar
    ],
    synchronize: true,
});

const app = express();
//const cors = require("cors");

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
                { name: 'Baseball Cap', type: ItemType.HAT, filepath: 'assets/sprites/baseball_cap.png' },
                { name: 'Cowboy Hat', type: ItemType.HAT, filepath: 'assets/sprites/cowboy_hat.png' },
                { name: 'Love Shirt', type: ItemType.SHIRT, filepath: 'assets/sprites/love_shirt.png' },
                { name: 'White Shirt', type: ItemType.SHIRT, filepath: 'assets/sprites/white_shirt.png' },
                { name: 'Blue Skirt', type: ItemType.BOTTOMS, filepath: 'assets/sprites/blue_skirt.png' },
                { name: 'Purple Pants', type: ItemType.BOTTOMS, filepath: 'assets/sprites/purple_pants.png' },
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
        // app.use(businessRouter);

        // Serve static files from the uploads folder
        app.use('/uploads', express.static(path.join('C://GoTouchGrass/uploads', '../uploads'))); // Serve the "uploads" directory
        app.use('/assets', express.static(path.join(__dirname, 'assets', 'sprites')));

        app.use(businessCreateAccountRouter);
        app.use(businessRegisterBusinessRouter);
        app.use(customerAccountRouter);
        app.use(businessLoginAccountRouter);
        app.use(businessLogoutAccountRouter);
        app.use(businessRetrieveAccountRouter);
        app.use(businessEditAccountRouter);
        app.use(businessCreateOutletRouter);

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
