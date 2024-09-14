import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}