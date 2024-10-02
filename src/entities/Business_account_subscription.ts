import { BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_register_business } from "./Business_register_business";
import { Outlet } from "./Outlet";

@Entity('business_account_subscription')
export class BusinessAccountSubscription extends BaseEntity {

    @PrimaryGeneratedColumn()
    subscription_id: number;

    @Column()
    title: string; // Subscription title (e.g., '1 Month Plan')

    @Column({ type: 'text', nullable: true })
    description: string; // Optional description of the subscription plan

    @Column({ type: 'varchar', length: 50, default: 'active' })
    status: string; // Status (e.g., 'active', 'expired')

    @CreateDateColumn()
    activation_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiration_date: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_cost: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_gem: number;

    @Column({ type: 'float', default: 0 })
    distance_coverage: number;

    @Column({ type: 'int', default: 3 })
    duration: number;

    @BeforeInsert()
    setExpirationDateAndCost() {
        const activationDate = new Date();
        this.activation_date = activationDate;

        // Set expiration date based on subscription duration
        const expirationDate = new Date(activationDate);
        expirationDate.setMonth(activationDate.getMonth() + this.duration);
        this.expiration_date = expirationDate;


    }


    @ManyToOne(() => Business_register_business, Business_register_business => Business_register_business.business_account_subscription)
    @JoinColumn({
        name: "business_id"
    })
    business_register_business: Business_register_business

    @ManyToOne(() => Outlet, Outlet => Outlet.business_account_subscription)
    @JoinColumn({
        name: "outlet_id"
    })
    outlet: Outlet;

}
