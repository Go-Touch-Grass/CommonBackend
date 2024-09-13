import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { Customer_account } from "./Customer_account";

 @Entity('Customer_profile')
 export class Customer_profile extends BaseEntity {
    
     @PrimaryGeneratedColumn()
     id: number;

     @Column({
        unique: true
     })
     avatarname: string;

     @Column()
     profilepicture: string;
    
     @OneToOne(
        () => Customer_account, account => account.customer_profile)
    customer_account: Customer_account;

 }