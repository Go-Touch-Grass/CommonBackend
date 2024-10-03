import {
    BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
} from "typeorm";

import { Business_register_business } from './Business_register_business';
import { Outlet } from './Outlet';

@Entity('business_voucher')
export class Business_voucher extends BaseEntity {
    @PrimaryGeneratedColumn()
    listing_id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ nullable: true })
    voucherImage: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    // Many vouchers can belong to one main business
    @ManyToOne(() => Business_register_business, business => business.vouchers, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business_register_business: Business_register_business;

    // Many vouchers can belong to one outlet (branch store)
    @ManyToOne(() => Outlet, outlet => outlet.vouchers, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outlet_id' })
    outlet: Outlet;
}