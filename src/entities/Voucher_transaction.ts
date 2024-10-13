import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { Business_voucher } from "./Business_voucher";
import { Customer_account } from "./Customer_account";

@Entity('voucher_transaction')
export class Voucher_transaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    voucherId: number;

    @Column()
    customerId: number; // Assuming you have a Customer entity

    @Column()
    purchaseDate: Date;

    @Column({ default: false })
    redeemed: boolean;

    @Column({ type: "int" })
    gems_spent: number;

    @Column({ default: false })
    used: boolean;

    // Define the relationship with Voucher
    @ManyToOne(() => Business_voucher, voucher => voucher.transactions)
    @JoinColumn({ name: 'voucherId' })
    voucher: Business_voucher;
}
