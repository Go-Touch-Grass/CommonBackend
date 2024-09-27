import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_register_business } from "./Business_register_business";
import { Outlet } from "./Outlet";
import { AbstractUser, UserRole } from "./abstract/AbstractUser";
import { Gem_test } from "./Gem_test";

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

    @Column({ nullable: true })
    deletedAt: Date;

    // OTP and OTP expiration
    @Column({ nullable: true })
    otp: string;

    @Column({ nullable: true, type: 'timestamp' })
    otpExpiresAt: Date | null; //allow null

    @OneToOne(
        () => Business_register_business,
        business_register_business => business_register_business.business_account,

        { cascade: true, onDelete: "CASCADE" } //cascade delete, can also set ID to null

    )
    business: Business_register_business;

    @OneToMany(() => Outlet, outlet => outlet.business, { cascade: true, onDelete: "CASCADE" })//cascade delete
    outlets: Outlet[];

    constructor() {
        super();
        // Automatically set the role to business for any new instance
        this.role = UserRole.BUSINESS;
    }

    @OneToOne(
        () => Gem_test,
        gem_test => gem_test.business_account)
    gem_test: Gem_test;
}
