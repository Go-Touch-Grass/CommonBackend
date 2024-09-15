import { BaseEntity, Column, Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Customer_profile } from "./Customer_profile";

@Entity('Customer_account')
export class Customer_account extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fullName: string;

    @Column({
        unique: true
    })
    username: string;

    @Column({
        unique: true
    })
    email: string;

    @Column()
    password: string;
    
    @OneToOne(
        () => Customer_profile, 
        profile => profile.customer_account, 
        { 
            cascade : true
        }
    )
    @JoinColumn({
        name:'customer_id'
    })
    customer_profile: Customer_profile 

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}