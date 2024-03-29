import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";
import { User } from "./User";

@Entity({ name: "apps" })
export class App extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: "varchar", length: 30 })
	title: string;

	@Column({ nullable: false, unique: true, type: 'uuid' })
	token?: string;

	@ManyToOne(() => User)
	@JoinColumn({
		name: 'userid'
	})
	user: User;
}
