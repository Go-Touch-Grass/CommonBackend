import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('business_register_business')
export class Business_register_business extends BaseEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column()
    location: string;
}