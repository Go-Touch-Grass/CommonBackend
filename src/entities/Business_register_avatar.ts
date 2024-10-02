//used to submit request for avatar creation for admin to approve
//actual avatar object will be stored in ready player me's BE

import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("business_avatar_request")
export class Business_avatar_request extends BaseEntity {
  @PrimaryGeneratedColumn()
  registration_id: number;

  @Column({
    unique: true,
  })
  business_id: number;

  @Column({
    unique: true,
  })
  avatarFile: string;

  //might need to change this to allow
  //addition of text for storylines
  //or any history/context the org wants to add
  //for their npc to display
}
