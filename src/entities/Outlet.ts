import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./Business_account"; // Ensure this path is correct

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
}
