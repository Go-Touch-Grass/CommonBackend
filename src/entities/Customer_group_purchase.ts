import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
    OneToMany,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { Customer_account } from "./Customer_account";
import { Business_voucher } from "./Business_voucher";

import { Customer_group_participant } from "./Customer_group_participant";
import { Customer_voucher } from "./Customer_vouchers";

export enum statusEnum {
    PENDING = 'pending', /// group not full
    COMPLETED = 'completed', // group full
    EXPIRED = 'expired'
}

export enum paymentStatusEnum {
    PENDING = 'pending', /// not paid
    COMPLETED = 'completed', // All paid

}

// Store information about each group purchase

@Entity("customer_group_purchase")
export class Customer_group_purchase extends Customer_voucher {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "int" })
    group_size: number; // Required group size for discount

    @Column({ type: "int", default: 0 })
    current_size: number; // How many people have joined so far

    @Column({
        type: 'enum',
        enum: statusEnum,
        default: statusEnum.PENDING
    })
    groupStatus: string;

    @Column({
        type: 'enum',
        enum: paymentStatusEnum,
        default: paymentStatusEnum.PENDING
    })
    paymentStatus: string;

    @Column({ type: "timestamp" })
    expires_at: Date; // When the group offer expires

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Business_voucher, voucher => voucher.groupPurchases)
    @JoinColumn({ name: "voucher_id" })
    voucher: Business_voucher;


    @ManyToOne(() => Customer_account, customer => customer.ownedGroupPurchases)
    @JoinColumn({ name: "creator_id" })
    creator: Customer_account;


    // Link to the participants of this group purchase
    @OneToMany(() => Customer_group_participant, participant => participant.groupPurchase, { eager: true })
    participants: Customer_group_participant[];


}
