import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./Business_account"; // Ensure this path is correct
import { BusinessAccountSubscription } from "./Business_account_subscription";

@Entity('outlet')
export class Outlet extends BaseEntity {
    @PrimaryGeneratedColumn()
    outlet_id: number;

    @Column()
    outlet_name: string;

    @Column()
    location: string;

    @Column()
    description: string;

    @Column()
    contact: string;

    @ManyToOne(() => Business_account, business_account => business_account.outlets)
    @JoinColumn({
        name: "business_id"
    })

    business: Business_account;


    @OneToMany(() => BusinessAccountSubscription, Business_account_subscription => Business_account_subscription.outlet)
    business_account_subscription: BusinessAccountSubscription[];

}
