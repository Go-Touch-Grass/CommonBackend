import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Business extends BaseEntity {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column({
        unique: true
    })
    username: string;

    @Column()
    password: string;

    @Column()
    name: string;
}