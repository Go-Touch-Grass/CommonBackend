import { BaseEntity, Column, Entity } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    BUSINESS = "business",
    CUSTOMER = "customer"
}

@Entity()
export abstract class AbstractUser extends BaseEntity {
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