import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Avatar } from "./avatar.entity";

@Entity('avatar_prompt')
export class AvatarPrompt extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    prompt: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'avatar_id' })
    avatarId: number;

    @OneToOne(() => Avatar, avatar => avatar.prompt)
    @JoinColumn({ name: 'avatar_id' })
    avatar: Avatar;
}