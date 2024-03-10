import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { TimeStamped } from "./Timestamp";
import { Tier } from "./Tier";

enum Status {
	ACTIVE = 1,
	DISABLED = 2,
}

@Entity({ name: "accounts" })
export class Account extends TimeStamped {
	@OneToOne(() => User, (user) => user.account)
	@JoinColumn({
		name: 'userid'
	})
	user: User;

	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Tier)
	@JoinColumn()
	tier: Tier;

	@Column({
		type: "smallint",
		default: Status.ACTIVE,
	})
	status: Status;
}
