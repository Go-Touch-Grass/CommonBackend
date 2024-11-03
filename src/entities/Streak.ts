import { Entity, Column, PrimaryGeneratedColumn, OneToOne, BaseEntity, JoinColumn } from 'typeorm';
import { Customer_account } from './Customer_account';

@Entity()
export class Streak extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 0 })
    streakCount: number;

    @Column({ type: 'timestamp', nullable: true })
    lastCheckIn: Date | null;

    @Column({ default: 0 })
    xpReward: number;

    @OneToOne(() => Customer_account, customer => customer.streak, { onDelete: 'CASCADE' })
    customer: Customer_account; // Property is `customer`, not `customer_account`
}
