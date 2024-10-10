import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_register_business } from "./Business_register_business";
import { Outlet } from "./Outlet";
import { UserRole } from "./abstract/AbstractUser";
import { Business_transaction } from "./Business_transaction";
import { Avatar } from "./Avatar";
import { Item } from "./Item";
import { AbstractStripeUser } from "./abstract/AbstractStripeUser";

@Entity('business_account')
export class Business_account extends AbstractStripeUser {
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

    @Column()
    email: string;
    */

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

    @Column({ type: 'int', default: 0 })
    gem_balance: number; // Should not initialize here, default is set to 0

    @OneToMany(() => Business_transaction, business_transaction => business_transaction.business_account, { cascade: true, onDelete: "CASCADE" })
    transactions: Business_transaction[];

    @OneToMany(() => Avatar, avatar => avatar.business)
    avatars: Avatar[];

    @OneToMany(() => Item, item => item.business)
    items: Item[];
}
