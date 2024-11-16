import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./businessAccount.entity";

export enum TransactionType {
    GEM_PURCHASE = "gem_purchase",
    SUBSCRIPTION_PAYMENT = "subscription_payment",
    GEM_CASHOUT = "gem_cashout",
}

@Entity('business_transaction')
export class Business_transaction extends BaseEntity {
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

    @Column({ type: 'enum', enum: TransactionType })
    transaction_type: TransactionType

    @ManyToOne(() => Business_account, business_account => business_account.transactions)
    @JoinColumn({
        name: "business_id"
    })
    business_account: Business_account;
}