import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_register_business } from "./Business_register_business";
import { Outlet } from "./Outlet";
import { AbstractUser, UserRole } from "./abstract/AbstractUser";

@Entity('business_account')
export class Business_account extends AbstractUser {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    /* extended from AbstractUser
    @Column({
        unique: true
    })
    username: string;

    @Column()
    password: string;
    */

    @Column()
    email: string;

    @Column({ nullable: true })
    profileImage: string;

    @OneToOne(
        () => Business_register_business,
        business_register_business => business_register_business.business_account)
    business: Business_register_business;

    @OneToMany(() => Outlet, outlet => outlet.business)
    outlets: Outlet[];

    constructor() {
        super();
        // Automatically set the role to business for any new instance
        this.role = UserRole.BUSINESS;
    }
}
