import {
    Column,
    Entity,
    OneToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { AbstractUser, UserRole } from './abstract/AbstractUser';

@Entity("Customer_account")
export class Customer_account extends AbstractUser {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fullName: string;

    @Column({
        unique: true,
    })
    username: string;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    password: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.CUSTOMER
    })
    role: UserRole = UserRole.CUSTOMER;
}
