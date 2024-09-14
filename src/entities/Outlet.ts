import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./Business_account"; // Ensure this path is correct

@Entity('outlet')
export class Outlet extends BaseEntity {
    @PrimaryGeneratedColumn()
    outlet_id: number;

    @Column()
    location: string;

    @Column()
    outlet_type: string;

    @Column()
    size: number;
    
    @ManyToOne(() => Business_account, business_account => business_account.outlets)
    @JoinColumn({
        name: "business_id"
    })

    business: Business_account;
}
