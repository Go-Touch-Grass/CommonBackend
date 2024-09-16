import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import express from "express";
import { Admin } from "./entities/Admin";
import { Business_account } from "./entities/Business_account";
import { Customer_account } from "./entities/Customer_account";
import { Customer_profile } from "./entities/Customer_profile";
import { businessCreateAccountRouter } from "./routes/business_create_account";
import { customerAccountRouter } from "./routes/customer_account";
import { customerProfileRouter } from "./routes/customer_profile";
import { Business_register_business } from "./entities/Business_register_business";
import { businessLoginAccountRouter } from "./routes/business_login_account";
import { businessLogoutAccountRouter } from "./routes/business_logout_account";
import { Outlet } from "./entities/Outlet";
import { businessRetrieveAccountRouter } from "./routes/business_retrieve_profile";
import { businessEditAccountRouter } from "./routes/business_edit_profile";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Admin, Business_account, Business_register_business, Customer_account, Customer_profile,Outlet],
    synchronize: true
});

const app = express();
//const cors = require("cors");

const main = async () => {
    try {
        await AppDataSource.initialize()
            .then(async () => {
                const adminRepository = AppDataSource.getRepository(Admin);

                // Check if admin user already exists
                const existingAdmin = await adminRepository.findOneBy({ username: 'admin' });

                if (!existingAdmin) {
                    const admin = adminRepository.create({
                        username: 'admin',
                        password: 'password',
                        name: 'admin',
                    });

                    await adminRepository.save(admin);
                    console.log('Admin user created');
                } else {
                    console.log('Admin user already exists');
                }
            })
            .catch((error) => console.log('Error during Data Source initialization', error));
            
            const cors = require('cors');
            app.use(cors({
                origin: 'http://localhost:3000'
              }));
              

        console.log("Connected to Postgres");
        app.use(express.json());
        app.use(businessCreateAccountRouter);
        app.use(customerAccountRouter);
        app.use(customerProfileRouter);
        app.use(businessLoginAccountRouter);
        app.use(businessLogoutAccountRouter);
        app.use(businessRetrieveAccountRouter)
        app.use(businessEditAccountRouter)
        app.listen(8080, () => {
            console.log("Now running on port 8080");
        });
    } catch (error) {
        console.error(error);
        throw new Error("Unable to connect to db");
    }
};

main()