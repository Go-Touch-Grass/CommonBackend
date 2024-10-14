import {
	Column,
	Entity,
	OneToOne,
	OneToMany,
	JoinColumn,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToMany,
	JoinTable
} from "typeorm";
import { UserRole } from "./abstract/AbstractUser";
import { Avatar } from "./Avatar";
import { Customer_transaction } from "./Customer_transaction";
import { AbstractStripeUser } from "./abstract/AbstractStripeUser";
import { Item } from "./Item";
import { Customer_inventory } from "./Customer_inventory";

@Entity("customer_account")
export class Customer_account extends AbstractStripeUser {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	fullName: string;

	/* extended from AbstractUser
	@Column({
		unique: true,
	})
	username: string;

	@Column({
		unique: true,
	})
	email: string;

	@Column()
	password: string;
	*/

	@Column({ default: 0 })
	exp: number;

	@CreateDateColumn()
	created_at: Date;

	@UpdateDateColumn()
	updated_at: Date;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.CUSTOMER,
	})
	role: UserRole = UserRole.CUSTOMER;

	@OneToOne(() => Avatar, (avatar) => avatar.customer, {
		cascade: true,
		onDelete: "CASCADE",
	})

	// OTP and OTP expiration
	@Column({ nullable: true })
	otp: string;

	@Column({ nullable: true, type: "timestamp" })
	otpExpiresAt: Date | null; //allow null

	@OneToOne(() => Avatar, (avatar) => avatar.customer, { cascade: true })
	@JoinColumn()
	avatar: Avatar;

	@Column({ type: "int", default: 0 })
	gem_balance: number; // Should not initialize here, default is set to 0

	@OneToMany(
		() => Customer_transaction,
		(transaction) => transaction.customer_account
	)
	transactions: Customer_transaction[];

	@ManyToMany(() => Customer_account)
	@JoinTable({
		name: "customer_friends",
		joinColumn: {
			name: "customer_id",
			referencedColumnName: "id"
		},
		inverseJoinColumn: {
			name: "friend_id",
			referencedColumnName: "id"
		}
	})
	friends: Customer_account[];

	@ManyToMany(() => Customer_account)
	@JoinTable({
		name: "friend_requests",
		joinColumn: {
			name: "sender_id",
			referencedColumnName: "id"
		},
		inverseJoinColumn: {
			name: "receiver_id",
			referencedColumnName: "id"
		}
	})
	sentFriendRequests: Customer_account[];

	@ManyToMany(() => Customer_account)
	@JoinTable({
		name: "friend_requests",
		joinColumn: {
			name: "receiver_id",
			referencedColumnName: "id"
		},
		inverseJoinColumn: {
			name: "sender_id",
			referencedColumnName: "id"
		}
	})
	receivedFriendRequests: Customer_account[];

	@ManyToMany(() => Item)
	@JoinTable({
		name: "customer_owned_items",
		joinColumn: {
			name: "customer_id",
			referencedColumnName: "id"
		},
		inverseJoinColumn: {
			name: "item_id",
			referencedColumnName: "id"
		}
	})
	ownedItems: Item[];



	@OneToOne(() => Customer_inventory, (customer_inventory) => customer_inventory.customer_account, {
		onDelete: "CASCADE",
	})
	@JoinColumn({ name: "customer_id" }) // Ensure this is set correctly
	customer_inventory: Customer_inventory;

}
