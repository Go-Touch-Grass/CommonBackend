import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Customer_account } from "./Customer_account";
import { Business_account } from "./Business_account";
import { Item } from "./Item";
import { Outlet } from "./Outlet";
import { Business_register_business } from "./Business_register_business";

export enum AvatarType {
    BUSINESS_REGISTER_BUSINESS = 'business_register_business',
    OUTLET = 'outlet',
    TOURIST = 'tourist'
}

@Entity('avatar')
export class Avatar extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: AvatarType,
    })
    avatarType: AvatarType;

    @OneToOne(() => Customer_account, customer => customer.avatar, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "customer_id" })
    customer: Customer_account;

    /*
    @ManyToOne(() => Business_account, business => business.avatars)
    @JoinColumn({ name: "business_id" })
    business: Business_account;
    */

    @OneToOne(() => Business_register_business, business_register_business => business_register_business.avatar, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "registration_id" })
    business_register_business: Business_register_business;


    @OneToOne(() => Outlet, outlet => outlet.avatar, {
        onDelete: "CASCADE"
    })
    @JoinColumn({ name: "outlet_id" })
    outlet: Outlet;


    @ManyToOne(() => Item, { nullable: true })
    @JoinColumn({ name: "base_id" })
    base: Item;

    @ManyToOne(() => Item, { nullable: true })
    @JoinColumn({ name: "hat_id" })
    hat: Item | null;

    @ManyToOne(() => Item, { nullable: true })
    @JoinColumn({ name: "shirt_id" })
    shirt: Item | null;

    @ManyToOne(() => Item, { nullable: true })
    @JoinColumn({ name: "bottom_id" })
    bottom: Item | null;
}