import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { TimeStamped } from "./Timestamp";
import { User } from "./User";
import TeamMember from "./TeamMember";

@Entity({
	name: "teams",
})
class Team extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User)
	@JoinColumn()
	owner: User;

	@OneToMany(() => TeamMember, (member) => member.team)
	members: TeamMember[];

	@Column({
		type: "varchar",
		nullable: false,
	})
	name: string;
}

export default Team;
