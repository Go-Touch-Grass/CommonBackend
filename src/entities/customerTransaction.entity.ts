import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Customer_account } from "./customerAccount.entity";

@Entity('customer_transaction')
export class Customer_transaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    transaction_id: number;

    @Column({ type: 'decimal', nullable: true, precision: 10, scale: 2 })
    currency_amount: number;

    @Column({ type: 'int', nullable: true })
    gems_added: number;

    @Column({ type: 'int', nullable: true })
    gems_deducted: number;

    @CreateDateColumn()
    transaction_date: Date;

    @Column({ nullable: true })
    stripe_payment_intent_id: string;

    @ManyToOne(() => Customer_account, customer_account => customer_account.transactions)
    @JoinColumn({
        name: "customer_id"
    })
    customer_account: Customer_account;
}