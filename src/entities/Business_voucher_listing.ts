import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('business_voucher_listing')
export class business_voucher_listing extends BaseEntity {
    @PrimaryGeneratedColumn()
    listing_id: number;

}