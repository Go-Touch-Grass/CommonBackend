import { BaseEntity, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, Column } from "typeorm";
import { Customer_group_purchase } from "./Customer_group_purchase";
import { Customer_account } from "./Customer_account";

//store information about each customer who joins a group purchase

@Entity("customer_group_participant")
export class Customer_group_participant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "timestamp" })
    joined_at: Date;

    @ManyToOne(() => Customer_group_purchase, groupPurchase => groupPurchase.participants)
    @JoinColumn({ name: "group_purchase_id" })
    groupPurchase: Customer_group_purchase;

    @ManyToOne(() => Customer_account, customer => customer.participants)
    @JoinColumn({ name: "customer_id" })
    customer: Customer_account;

    @Column({ type: 'enum', enum: ['pending', 'paid', 'failed'], default: 'pending' })
    payment_status: 'pending' | 'paid' | 'failed';

    @Column({ type: 'timestamp', nullable: true })
    payment_completed_at: Date | null;

}
