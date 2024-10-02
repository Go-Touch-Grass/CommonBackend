import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./Business_account";

@Entity('business_transaction')
export class Business_transaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    transaction_id: number;

    @Column({ nullable: true })
    currency_amount: number;

    @Column({ nullable: true })
    gems_added: number;

    @Column({ nullable: true })
    gems_deducted: number;

    @CreateDateColumn()
    transaction_date: Date;

    @ManyToOne(() => Business_account, business_account => business_account.transactions)
    @JoinColumn({
        name: "business_id"
    })
    business_account: Business_account;
}