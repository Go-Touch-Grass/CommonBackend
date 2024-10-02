import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Customer_account } from "./Customer_account";
import { Business_account } from "./Business_account";
import { Item } from "./Item";

export enum AvatarType {
    BUSINESS = 'business',
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

    @OneToOne(() => Customer_account, customer => customer.avatar)
    @JoinColumn({ name: "customer_id" })
    customer: Customer_account;

    @ManyToOne(() => Business_account, business => business.avatars)
    @JoinColumn({ name: "business_id" })
    business: Business_account;

    @ManyToOne(() => Item)
    @JoinColumn({ name: "hat_id" })
    hat: Item;

    @ManyToOne(() => Item)
    @JoinColumn({ name: "shirt_id" })
    shirt: Item;

    @ManyToOne(() => Item)
    @JoinColumn({ name: "bottom_id" })
    bottom: Item;
}