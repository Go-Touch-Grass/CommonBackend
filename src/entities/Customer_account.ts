import { Column, Entity, OneToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { AbstractUser } from "./abstract/AbstractUser";
import { Customer_profile } from "./Customer_profile";

@Entity('Customer_account')
export class Customer_account extends AbstractUser {
    @PrimaryGeneratedColumn()
    customer_id: number;
    
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