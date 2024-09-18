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
        app.use(
            cors({
                origin: "http://localhost:3000",
            })
        );

        console.log("Connected to Postgres");

        app.use(express.json());
        app.use(adminRouter);
        // app.use(businessRouter);

        // Serve static files from the uploads folder
        app.use('/uploads', express.static(path.join('C://GoTouchGrass/uploads', '../uploads'))); // Serve the "uploads" directory


        app.use(businessCreateAccountRouter);
        app.use(businessRegisterBusinessRouter);
        app.use(customerAccountRouter);
        app.use(businessLoginAccountRouter);
        app.use(businessLogoutAccountRouter);
        app.use(businessRetrieveAccountRouter);
        app.use(businessEditAccountRouter);
        app.use(businessCreateOutletRouter);

        app.listen(8080, () => {
            console.log("Now running on port 8080");
        });
    } catch (error) {
        console.error(error);
        throw new Error("Unable to connect to db");
    }
};

main();
