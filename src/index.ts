import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import express from "express";
import cors from "cors";
import { Admin } from "./entities/Admin";
import { Business } from "./entities/Business";
import { Customer } from "./entities/Customer";
import { businessRouter } from "./routes/business";
import { customerRouter } from "./routes/customer";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [Admin, Business, Customer],
    synchronize: true
});

const app = express();

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

        console.log("Connected to Postgres");
        app.use(express.json());
        app.use(cors());

        app.use(businessRouter);
        app.use(customerRouter);

        app.listen(8080, () => {
            console.log("Now running on port 8080");
        });
    } catch (error) {
        console.error(error);
        throw new Error("Unable to connect to db");
    }
};

main()