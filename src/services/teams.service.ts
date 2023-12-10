import AppTeam from "@entities/AppTeam";
import Team from "@entities/Team";
import TeamMember from "@entities/TeamMember";
import { User } from "@entities/User";
import { Database, Redis } from "@lib/database";
import { Repository } from "typeorm";
import Mailer from "./mail.service";
import { randomUUID } from "crypto";

export default class TeamService {
	private teamRepository: Repository<Team>;
	private memberRepository: Repository<TeamMember>;
	private appRepository: Repository<AppTeam>;
	private mailer: Mailer;

	constructor() {
		this.teamRepository = Database.datasource!.getRepository(Team);
		this.memberRepository = Database.datasource!.getRepository(TeamMember);
		this.appRepository = Database.datasource!.getRepository(AppTeam);
		this.mailer = new Mailer();
	}

	async getTeams(owner: User) {
		return await this.teamRepository.query("SELECT * FROM teams WHERE ownerId = ?", [owner.id]);
	}

	async getTeam(teamId: number) {
		console.log(teamId);
		return await this.teamRepository.findOne({
			where: { id: teamId },
			// loadRelationIds: {
			// 	relations: ["members"]
			// },
			relations: {
				members: {
					user: true,
				},
			},
		});
	}

	async sendTeamInvite(
		team: Team,
		email: string,
		options = {
			existingUser: false,
		}
	) {
		const token = randomUUID({
			disableEntropyCache: true,
		});

		const redis = Redis.getClient()!;

		redis.setex(
			`teams:invite-to-${token}-email-${email}`,
			60 * 30,
			JSON.stringify({
				email,
				teamId: team.id,
			})
		);

		let link = `https://lags.vercel.app/accept-invite/?token=${token}&email=${email}`;

		if (options.existingUser == false) {
			link += `&new`;
		}

		return await this.mailer.send(
			email,
			`<p>You've been invited to join <b>${team.name}</b> on LAAS. Click <a href='${link}'>here</a> to join or ignore this e-mail. This invite will expire in 30 minutes.</p>`,
			"You've been invited."
		);
	}

	async acceptInvite(token: string) {}
}
