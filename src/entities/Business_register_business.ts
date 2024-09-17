import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "../entities/Business_account"; 

@Entity('business_register_business')
export class Business_register_business extends BaseEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column()
    location: string;

    @OneToOne(() => Business_account, business_account => business_account.business)
    @JoinColumn({
        name: "business_id" 
    })
    business_account: Business_account;
}
