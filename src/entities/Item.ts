import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Business_account } from "./Business_account";

export enum ItemType {
    BASE = 'base',
    HAT = 'hat',
    SHIRT = 'shirt',
    BOTTOM = 'bottom'
}

@Entity('item')
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ItemType,
    })
    type: ItemType;

    @Column()
    filepath: string;

    @Column({ default: false })
    approved: boolean;

    @Column({ nullable: true })
    business_id: number;

    @ManyToOne(() => Business_account, business => business.items)
    @JoinColumn({ name: 'business_id' })
    business: Business_account;
}