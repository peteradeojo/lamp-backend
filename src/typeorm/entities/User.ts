import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { TimeStamped } from "./Timestamp";

@Entity({ name: "users" })
export class User extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 30 })
	name: string;

	@Column({ type: "varchar", unique: true, length: 50 })
	email: string;

	@Column({ type: "varchar", length: 60, select: false })
	password?: string;

	@Column({ type: "boolean", default: false })
	isAdmin: boolean;

	@Column({ type: "varchar", default: false, length: 255, select: false })
	twoFactorSecret?: string;
}
