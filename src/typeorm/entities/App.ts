import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TimeStamped } from "./Timestamp";
import { User } from "./User";

@Entity({ name: "apps" })
export class App extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	title: string;

	@Column({ nullable: true })
	token?: string;

	@ManyToOne(() => User)
	user: User;
}
