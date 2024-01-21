import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";
import { App } from "./App";

export enum LogType {
	INFO = "info",
	ERROR = "error",
	WARNING = "warn",
	DEBUG = "debug",
	CRITICAL = "critical",
	FATAL = "fatal",
}

@Entity({ name: "logs" })
export class Log extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar" })
	level: string;

	@Column({ length: 1024 })
	text: string;

	@Column({ type: "varchar", nullable: true })
	ip?: string;

	@Column({ type: "json", nullable: true })
	tags?: string[];

	@Column({ nullable: true, type: "json" })
	context?: string;

	@ManyToOne(() => App)
	app: App;

	@Column({
		type: "boolean",
		default: false,
	})
	saved: boolean;
}
