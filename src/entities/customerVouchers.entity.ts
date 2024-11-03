import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, BaseEntity } from 'typeorm';
import { Customer_inventory } from './customerInventory.entity';
import { Business_voucher } from './businessVoucher.entity';

@Entity('customer_vouchers')
export class Customer_voucher extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer_inventory, (inventory) => inventory.voucherInstances, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inventory_id' })
    inventory: Customer_inventory;

    @ManyToOne(() => Business_voucher, (voucher) => voucher.voucherInstances, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'voucher_id' })
    voucher: Business_voucher;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @Column({ default: true })
    status: boolean; // redemption status
}
