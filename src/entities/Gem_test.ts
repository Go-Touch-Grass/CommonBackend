import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Business_account } from "./Business_account";

@Entity()
export class Gem_test extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance: number; // Should not initialize here, default is set to 0

    @OneToOne(() => Business_account, (business_account) => business_account.gem_test)
    @JoinColumn({
        name: "business_id",
    })
    business_account: Business_account;

    // Method to top up gems
    async topUp(amount: number) {
        try {
            // Ensure the amount is a valid number
            if (typeof amount !== 'number' || amount <= 0) {
                throw new Error('Amount must be a positive number');
            }
    
            // Ensure balance is treated as a number
            const currentBalance = parseFloat(this.balance.toString()); // Convert balance to number if it's a string
            const newBalance = currentBalance + amount; // Add the amount to the balance
    
            // Update the balance with two decimal places
            this.balance = parseFloat(newBalance.toFixed(2));
            await this.save(); // Save the updated balance
    
            return this.balance; // Optionally return the updated balance
        } catch (error) {
            console.error('Error during top up:', error);
            throw error; // Rethrow the error to be handled elsewhere
        }
    }
}
