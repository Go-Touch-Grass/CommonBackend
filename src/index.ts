import * as dotenv from "dotenv";

dotenv.config(); // Ensure dotenv.config() is called before any other files are executed

import { DataSource } from "typeorm";
import express from "express";
import path from "path";
import { Admin } from "./entities/admin.entity";
import bcrypt from "bcrypt";

import { Customer_account } from "./entities/customerAccount.entity";
import { adminRouter } from "./routes/admin.routes";

import { customerAccountRouter } from "./routes/customerAccount.routes";
import { Business_register_business } from "./entities/businessRegisterBusiness.entity";

import { Outlet } from "./entities/outlet.entity";
import { Business_account } from "./entities/businessAccount.entity"; // Add this line
import { businessRouter } from "./routes/business.routes";
import { BusinessAccountSubscription } from "./entities/businessAccountSubscription.entity";
import Stripe from "stripe";
import { paymentRouter } from "./routes/payment.routes";
import { Business_transaction } from "./entities/businessTransaction.entity";
import { Item, ItemType } from "./entities/item.entity";
import { Avatar } from "./entities/avatar.entity";
import { itemRouter } from "./routes/item.routes";
import { avatarRouter } from "./routes/avatar.routes";
import { Customer_transaction } from "./entities/customerTransaction.entity";
import { customerSocialRouter } from "./routes/customerSocial.routes";
import "./jobs/subscriptionReminderJob";

import { Business_voucher } from "./entities/businessVoucher.entity";
import { Customer_inventory } from "./entities/customerInventory.entity";
import { Voucher_transaction } from "./entities/voucherTransaction.entity";

import { Customer_group_purchase } from "./entities/customerGroupPurchase.entity";
import { Customer_group_participant } from "./entities/customerGroupParticipant.entity";
import { customerInventoryRouter } from './routes/customerInventory.routes';
import { Customer_voucher } from "./entities/customerVouchers.entity";
import { Streak } from "./entities/Streak";

import { businessAnalyticsRouter } from "./routes/businessAnalytics.routes";
import { chatRouter } from "./routes/chat.routes";
import { avatarPromptRouter } from "./routes/avatarPrompt.routes";
import { AvatarPrompt } from "./entities/avatarPrompt.entity";

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
		Business_voucher,
		Customer_account,
		Outlet,
		BusinessAccountSubscription,
		Business_transaction,
		Item,
		Avatar,
		Customer_transaction,
		Customer_inventory,
		Voucher_transaction,
		Customer_voucher,
		Customer_group_purchase,
		Customer_group_participant,
		Streak,
		AvatarPrompt,
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
				const adminRepository =
					AppDataSource.getRepository(Admin);

				// Check if admin user already exists
				const existingAdmin =
					await adminRepository.findOneBy({
						username: "admin",
					});

				if (!existingAdmin) {
					const password = "password";
					const hashedPassword =
						await bcrypt.hash(password, 10);

					const admin = adminRepository.create({
						username: "admin",
						password: hashedPassword,
						name: "admin",
						role: "admin",
					});

					await adminRepository.save(admin);
					console.log("Admin user created");
				} else {
					console.log(
						"Admin user already exists"
					);
				}
			})
			.catch((error) =>
				console.log(
					"Error during Data Source initialization",
					error
				)
			);

		const initializeDefaultItems = async () => {
			const itemRepository =
				AppDataSource.getRepository(Item);

			const defaultItems = [
				{
					name: "Default Base",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/base/avatar_base.png",
					approved: true,
				},
				{
					name: "Baseball Cap",
					type: ItemType.HAT,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/hat/baseball_cap.png",
					approved: true,
				},
				{
					name: "Cowboy Hat",
					type: ItemType.HAT,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/hat/cowboy_hat.png",
					approved: true,
				},
				{
					name: "Love Shirt",
					type: ItemType.SHIRT,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/shirt/love_shirt.png",
					approved: true,
				},
				{
					name: "White Shirt",
					type: ItemType.SHIRT,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/shirt/white_shirt.png",
					approved: true,
				},
				{
					name: "Blue Skirt",
					type: ItemType.BOTTOM,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/bottom/blue_skirt.png",
					approved: true,
				},
				{
					name: "Purple Pants",
					type: ItemType.BOTTOM,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/bottom/purple_pants.png",
					approved: true,
				},
				{
					name: "Light Base",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/main/base/avatar_light.png",
					approved: true,
				},
				{
					name: "Tan Base 1",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/main/base/avatar_tan_1.png",
					approved: true,
				},
				{
					name: "Tan Base 2",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/main/base/avatar_tan_2.png",
					approved: true,
				},
				{
					name: "Tan Base 3",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/main/base/avatar_tan_3.png",
					approved: true,
				},
				{
					name: "Tan Base 4",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/main/base/avatar_tan_4.png",
					approved: true,
				},

				{
					name: "Nature Base",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/base/avatar_base_nature.png",
					approved: true,
				},
				{
					name: "Water Base",
					type: ItemType.BASE,
					filepath: "https://raw.githubusercontent.com/Go-Touch-Grass/sprites/refs/heads/main/base/avatar_base_water.png",
					approved: true,
				},
			];

			for (const item of defaultItems) {
				const existingItem =
					await itemRepository.findOne({
						where: { name: item.name },
					});
				if (!existingItem) {
					const newItem =
						itemRepository.create(item);
					await itemRepository.save(newItem);
					console.log(
						`Created default item: ${item.name}`
					);
				} else {
					console.log(
						`Default item already exists: ${item.name}`
					);
				}
			}
		};

		await initializeDefaultItems();
		console.log("Default items initialized");

		const cors = require("cors");
		const allowedOrigins = [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
		];
		app.use(
			cors({
				origin: function (origin, callback) {
					// If origin is in the allowed origins list or if it's undefined (like in some local testing environments)
					if (
						!origin ||
						allowedOrigins.includes(origin)
					) {
						callback(null, true);
					} else {
						callback(
							new Error(
								"Not allowed by CORS"
							)
						);
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
		const uploadsPath = path.join(__dirname, './uploads'); // For relative path
		app.use('/uploads', express.static(uploadsPath));
		//console.log("__dirname is", __dirname);
		//console.log("upload file path is", uploadsPath);

		//app.use('/assets', express.static(path.join(__dirname, 'assets', 'sprites')));
		app.use(customerAccountRouter);
		app.use(paymentRouter);
		app.use(itemRouter);
		app.use(avatarRouter);
		app.use(customerSocialRouter);
		app.use(customerInventoryRouter);
		app.use(chatRouter);
		app.use(avatarPromptRouter);
		app.use(businessAnalyticsRouter);

		app.listen(8080, () => {
			console.log("Now running on port 8080");
		});
	} catch (error) {
		console.error(error);
		throw new Error("Unable to connect to db");
	}
};

main();
