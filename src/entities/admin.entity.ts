import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AbstractUser } from "./abstract/abstractUser.entity";

@Entity()
export class Admin extends AbstractUser {
    @PrimaryGeneratedColumn()
    admin_id: number;

    @Column()
    name: string;
}