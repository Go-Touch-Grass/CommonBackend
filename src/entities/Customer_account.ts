import {
    Column,
    Entity,
    OneToOne,
    OneToMany,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { AbstractUser, UserRole } from './abstract/AbstractUser';
import { Avatar } from "./Avatar";
import { Customer_transaction } from "./Customer_transaction";

@Entity("Customer_account")
export class Customer_account extends AbstractUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fullName: string;

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

    @Column({ default: 0 })
    exp: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.CUSTOMER
    })
    role: UserRole = UserRole.CUSTOMER;

    @OneToOne(() => Avatar, avatar => avatar.customer, { 
        cascade: true,
        onDelete: "CASCADE"
    })
    @JoinColumn()
    avatar: Avatar;

    @Column({ type: 'int', default: 0 })
    gem_balance: number; // Should not initialize here, default is set to 0

    @OneToMany(() => Customer_transaction, transaction => transaction.customer_account)
    transactions: Customer_transaction[];
}
