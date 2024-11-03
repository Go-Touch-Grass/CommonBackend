import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, BaseEntity } from 'typeorm';
import { Business_voucher } from "./businessVoucher.entity";
import { Customer_account } from "./customerAccount.entity";

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

    @Column({ default: "false" })
    redeemed: string;

    @Column({ type: "int" })
    gems_spent: number;

    @Column({ default: false })
    used: boolean;

    // Define the relationship with Voucher
    @ManyToOne(() => Business_voucher, voucher => voucher.transactions)
    @JoinColumn({ name: 'voucherId' })
    voucher: Business_voucher;
}
