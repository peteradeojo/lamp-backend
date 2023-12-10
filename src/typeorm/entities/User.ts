import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { TimeStamped } from "./Timestamp";
import { Account } from "./Account";
import Team from "./Team";

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

	@Column({ type: "varchar", length: 255, select: false, nullable: true })
	twoFactorSecret?: string;

	@Column({ type: "varchar", nullable: true })
	githubId?: string;

	@OneToOne(() => Account, (account) => account.user)
	account: Account;

	@OneToMany(() => Team, (team) => team.owner)
	teams: Team[]

	get twoFactorEnabled(): boolean | undefined {
		return !!this.twoFactorSecret;
	}
}
