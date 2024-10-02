import { BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_register_business } from "./Business_register_business";
import { Outlet } from "./Outlet";
import { Avatar } from "./Avatar";

@Entity('business_account')
export class Business_account extends BaseEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({
        unique: true
    })
    username: string;

    @Column()
    password: string;

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

    @OneToMany(() => Avatar, avatar => avatar.business)
    avatars: Avatar[];
}
