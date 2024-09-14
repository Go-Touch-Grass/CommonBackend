import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_register_business } from "../entities/Business_register_business"; // Ensure this path is correct
import { Outlet } from "./Outlet";

@Entity('business_account')
export class Business_account extends BaseEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column({
        unique: true
    })
    username: string;

    @Column()
    password: string;

    @Column()
    email: string;

    @OneToOne(() => Business_register_business, business_register_business => business_register_business.business_account)
    business: Business_register_business;

    @OneToMany(() => Outlet, outlet => outlet.business)
    outlets: Outlet[];
}
