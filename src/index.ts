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
        app.use('/uploads', express.static(path.join('C://GoTouchGrass/uploads', '../uploads'))); // Serve the "uploads" directory

        app.use(customerAccountRouter);

        app.listen(8080, () => {
            console.log("Now running on port 8080");
        });
    } catch (error) {
        console.error(error);
        throw new Error("Unable to connect to db");
    }
};

main();
