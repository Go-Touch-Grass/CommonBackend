import {
    Entity,
    PrimaryGeneratedColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from "typeorm";
import { Business_voucher } from "./Business_voucher";
import { Customer_account } from "./Customer_account";

@Entity("Customer_inventory")
export class Customer_inventory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToOne(() => Customer_account, (customer_account) => customer_account.customer_inventory, {
        onDelete: "CASCADE",
    })
    customer_account: Customer_account;


    // One inventory can have many vouchers
    @OneToMany(() => Business_voucher, (voucher) => voucher.customer_inventory)
    vouchers: Business_voucher[];
}
