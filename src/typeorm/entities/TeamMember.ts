import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { TimeStamped } from "./Timestamp";
import { User } from "./User";
import Team from "./Team";

@Entity()
@Unique(['user', 'team'])
class TeamMember extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User)
	@JoinColumn()
	user: User;

	@ManyToOne(() => Team)
	@JoinColumn()
	team: Team;

	@Column({
		type: 'smallint',
		default: 0,
	})
	status: number;
}

export default TeamMember;
