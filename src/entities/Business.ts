import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AbstractUser } from "./abstract/AbstractUser";

@Entity()
export class Business extends AbstractUser {
    @PrimaryGeneratedColumn()
    business_id: number;

    @Column()
    name: string;
}