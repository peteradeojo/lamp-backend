import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { TimeStamped } from "./Timestamp";
import Team from "./Team";
import { App } from "./App";

@Entity({
	name: "team_apps",
})
@Unique(['team', 'app'])
class AppTeam extends TimeStamped {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => Team)
  @JoinColumn()
	team: Team;

	@ManyToOne(() => App)
	@JoinColumn()
	app: App;

}

export default AppTeam;