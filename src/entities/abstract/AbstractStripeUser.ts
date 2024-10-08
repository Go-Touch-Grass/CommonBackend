import { Column, Entity } from "typeorm";
import { AbstractUser } from "./AbstractUser";

@Entity()
export abstract class AbstractStripeUser extends AbstractUser {
    @Column({
        unique: true
    })
    email: string;

    @Column({ nullable: true })
    stripeId: string;
}