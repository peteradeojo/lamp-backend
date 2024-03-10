import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";

@Entity({name: 'payment_plans'})
export class PaymentPlan extends TimeStamped {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar'
  })
  name: string

  @Column({
    type: 'float'
  })
  amount: number;

  @Column({
    type: 'bigint',
    name: 'planid'
  })
  planId: number;

  @Column({
    type: 'varchar',
    name: 'plancode',
  })
  planCode: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  provider_data: any;
}