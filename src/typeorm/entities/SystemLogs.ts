import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";

@Entity({
	name: "system_logs",
})
export class SystemLog extends TimeStamped {
	@PrimaryColumn({
		type: "uuid",
	})
	@Generated("uuid")
	id: string;

	@Column({
		type: "varchar",
	})
	text: string;

	@Column({
		nullable: true,
		type: "varchar",
	})
	stack: string;

	@Column({
		nullable: true,
		type: "json",
	})
	context: string;

	@Column({ type: "enum", enum: ["error", "fatal", "info", "debug"] })
	level: string;

  @Column({type: "bit", nullable: true})
  from_system: boolean

  @Column({type: "bit", nullable: true})
  from_user: boolean
}
