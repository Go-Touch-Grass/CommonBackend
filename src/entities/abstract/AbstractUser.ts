import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    BUSINESS = "business",
    CUSTOMER = "customer"
}

@Entity()
export class AbstractUser extends BaseEntity {
    @Column({
        unique: true
    })
    username: string;

    @Column()
    password: string;

    @Column({
        type: "enum",
        enum: UserRole,
    })
    role: string;
}