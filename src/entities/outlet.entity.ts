import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./businessAccount.entity"; // Ensure this path is correct
import { BusinessAccountSubscription } from "./businessAccountSubscription.entity";
import { Business_voucher } from './businessVoucher.entity';
import { Avatar } from "./avatar.entity";
import { Business_register_business } from "./businessRegisterBusiness.entity";
import { Item } from "./item.entity";
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

    @OneToMany(() => Business_voucher, voucher => voucher.outlet)
    vouchers: Business_voucher[];

    @OneToOne(() => Avatar, (avatar) => avatar.outlet, { cascade: true })
    @JoinColumn()
    avatar: Avatar;

    @OneToMany(() => Item, item => item.outlet)
    items: Item[];

    @Column({ default: false })
    hasSubscriptionPlan: boolean;

    @Column({ default: false })
    banStatus: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    /*@ManyToOne(() => Business_register_business, business_register_business => business_register_business.outlets)
    @JoinColumn({
        name: "registration_id"
    })
    business_register_business: Business_register_business;
    */
}
