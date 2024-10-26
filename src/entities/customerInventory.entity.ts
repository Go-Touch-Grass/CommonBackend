import {
    Entity,
    PrimaryGeneratedColumn,
    OneToMany,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
    Column,
    ManyToMany,
    JoinTable,
} from "typeorm";
import { Business_voucher } from "./businessVoucher.entity";
import { Customer_account } from "./customerAccount.entity";
import { Customer_voucher } from "./customerVouchers.entity";

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

    @Column({ default: false })
    used: boolean;

    @OneToMany(() => Customer_voucher, (customerVoucher) => customerVoucher.inventory)
    voucherInstances: Customer_voucher[];

}
