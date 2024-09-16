import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AbstractUser } from "./abstract/AbstractUser";

@Entity()
export class Admin extends AbstractUser {
    @PrimaryGeneratedColumn()
    admin_id: number;

    @Column()
    name: string;
}