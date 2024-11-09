import { Column, Entity } from "typeorm";
import { AbstractUser } from "./abstractUser.entity";

@Entity()
export abstract class AbstractStripeUser extends AbstractUser {
    @Column({
        unique: true
    })
    email: string;

    @Column({ nullable: true })
    stripeCustomerId: string; // To identify user when they are paying us

    @Column({ nullable: true, type: 'varchar' })
    paymentMethodId: string | null;
}