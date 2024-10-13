import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    OneToMany,
    ManyToMany,
    JoinTable,
} from "typeorm";
import { Business_register_business } from './Business_register_business';
import { Outlet } from './Outlet';
import { Customer_inventory } from "./Customer_inventory";
import { Voucher_transaction } from "./Voucher_transaction";

@Entity('business_voucher')
export class Business_voucher extends BaseEntity {
    @PrimaryGeneratedColumn()
    listing_id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ nullable: true })
    voucherImage: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column()  // Duration in days
    duration: number;

    @Column()
    expirationDate: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true })
    discountedPrice: number;

    @BeforeInsert()
    async calculateFields() {
        // Assuming you want to set expiration date based on duration
        if (this.duration && this.duration > 0) {
            const now = new Date();
            const expirationDate = new Date(now.getTime() + this.duration * 24 * 60 * 60 * 1000); // Duration in days
            if (isNaN(expirationDate.getTime())) {
                throw new Error('Calculated expiration date is invalid');
            }
            this.expirationDate = expirationDate;
        }
    }
    // Many vouchers can belong to one main business
    @ManyToOne(() => Business_register_business, business => business.vouchers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business_register_business: Business_register_business;

    // Many vouchers can belong to one outlet (branch store)
    @ManyToOne(() => Outlet, outlet => outlet.vouchers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outlet_id' })
    outlet: Outlet;

    // A voucher can belong to a customer's inventory
    /*@ManyToOne(() => Customer_inventory, customer_inventory => customer_inventory.vouchers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inventory_id' })
    customer_inventory: Customer_inventory;*/

    /*
    @ManyToMany(() => Customer_inventory, (customer_inventory) => customer_inventory.vouchers)
    @JoinTable({
        name: 'customer_vouchers', // Junction table name
        joinColumn: {
            name: 'voucher_id',  // Corrected, it should be voucher_id as per the column in Business_voucher
            referencedColumnName: 'listing_id',  // listing_id is the primary key of Business_voucher
        },
        inverseJoinColumn: {
            name: 'inventory_id',  // inventory_id is the primary key of Customer_inventory
            referencedColumnName: 'id',
        },
    })
    customer_inventory: Customer_inventory[];
    */

    @OneToMany(() => Voucher_transaction, transaction => transaction.voucher)
    transactions: Voucher_transaction[];
}
