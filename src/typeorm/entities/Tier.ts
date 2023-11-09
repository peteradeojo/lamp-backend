import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";

@Entity({name: 'tiers'})
export class Tier extends TimeStamped {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 256,
  })
  description: string;

  @Column({
    type: 'json'
  })
  limits: string[];

  @Column({
    type: 'boolean',
    default: true
  })
  generallyAvailable: boolean;

  @Column({
    type: 'float',
    default: 0,
  })
  amount: number;
}