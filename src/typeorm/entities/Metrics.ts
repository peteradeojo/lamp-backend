import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";
import { App } from "./App";

@Entity({ name: "metrics" })
export class Metrics extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar" })
	level: string;

	@Column({ type: "integer", default: 0 })
	weight: number;

  @ManyToOne(() => App)
  app: App;
}
