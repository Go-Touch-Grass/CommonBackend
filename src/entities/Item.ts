import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Business_register_business, statusEnum } from "./Business_register_business";
import { Outlet } from "./Outlet";

export enum ItemType {
    BASE = 'base',
    HAT = 'hat',
    SHIRT = 'shirt',
    BOTTOM = 'bottom'
}

@Entity('item')
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ItemType,
    })
    type: ItemType;

    @Column()
    filepath: string;

    @Column({ type: "enum", enum: statusEnum, default: statusEnum.APPROVED })
    status: statusEnum;

    @Column({nullable: true})
    remarks: string;
    
    @ManyToOne(() => Business_register_business, business => business.items, { nullable: true })
    @JoinColumn({ name: 'registration_id' })
    business_register_business: Business_register_business;

    @ManyToOne(() => Outlet, outlet => outlet.items, { nullable: true })
    @JoinColumn({ name: 'outlet_id' })
    outlet: Outlet | null;

    @Column({ type: 'float', nullable: true })
    scale: number;

    @Column({ type: 'float', nullable: true })
    xOffset: number;

    @Column({ type: 'float', nullable: true })
    yOffset: number;

}
