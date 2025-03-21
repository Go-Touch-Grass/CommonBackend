import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./businessAccount.entity";
import { BusinessAccountSubscription } from "./businessAccountSubscription.entity";
import { Business_voucher } from './businessVoucher.entity';
import { Avatar } from "./avatar.entity";
import { Outlet } from "./outlet.entity"
import { Item } from "./item.entity"; // Add this import
//Broadly speaking, there are 5 Retail Industry Areas covering a total of 18 Industry Sectors.
/*
Specialty Retailing: Floristry; Newsagents, Stationery & Bookshops; Community Pharmacy; Specialty Stores; Jewellery; Fashion, Clothing & Footwear
Food & Beverage: Supermarkets; Liquor; Fruit & Vegetable; Fast Food & Take-away; Specialty Food
Work, Home & Lifestyle: Entertainment, Communication & Technology; Sport, Recreation & Leisure; Home Living; Hardware, Trade & Gardening
General Retailing: Department Stores; Discount & Variety
Wholesale & Logistics: Wholesale & Logistics
https://hub.com.sg/hub-guides/how-to-start-a-retail-business-in-singapore/
*/

export enum BusinessCategories {
    SPECIALITYRETAIL = 'specialityretail',
    FOODnBEVERAGE = 'foodnbeverage',
    WORKnHOMEnLIFESTYLE = 'workhomelifestyle',
    GENERALRETAIL = 'generalretail',
    WHOLESALEnLOGISTICS = 'wholesalenlogistics'
}

export enum statusEnum {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

@Entity('business_register_business')
export class Business_register_business extends BaseEntity {
    @PrimaryGeneratedColumn()
    registration_id: number;

    @Column({
        unique: true
    })
    entityName: string;

    @Column()
    location: string;

    @Column({
        type: 'enum',
        enum: BusinessCategories,
    })
    category: string;

    @Column()
    proof: string;

    @Column({
        type: 'enum',
        enum: statusEnum,
    })
    status: string;

    @Column({
        nullable: true,
    })
    remarks: string; // reason for rejection

    @Column({ default: false })
    hasSubscriptionPlan: boolean;


    @OneToOne(() => Business_account, business_account => business_account.business)
    @JoinColumn({
        name: "business_id"
    })
    business_account: Business_account;

    @OneToMany(() => BusinessAccountSubscription, Business_account_subscription => Business_account_subscription.business_register_business)
    business_account_subscription: BusinessAccountSubscription[];

    @OneToMany(() => Business_voucher, voucher => voucher.business_register_business)
    vouchers: Business_voucher[];

    @OneToOne(() => Avatar, (avatar) => avatar.business_register_business, { cascade: true })
    @JoinColumn()
    avatar: Avatar;

    @OneToMany(() => Item, item => item.business_register_business)
    items: Item[];

    @Column({ default: false })
    banStatus: boolean;

    /*
    @OneToMany(() => Outlet, outlet => outlet.business, { cascade: true, onDelete: "CASCADE" })//cascade delete
    outlets: Outlet[];
    */
}
