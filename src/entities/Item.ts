import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum ItemType {
    HAT = 'hat',
    SHIRT = 'shirt',
    BOTTOMS = 'bottoms'
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
}