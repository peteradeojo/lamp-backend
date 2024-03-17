import Team from "@entities/Team";
import TeamMember from "@entities/TeamMember";
import { User } from "@entities/User";
import { Database, Redis } from "@lib/database";
import { Repository } from "typeorm";
import Mailer from "./mail.service";
import { randomUUID } from "crypto";
import { Request } from "express";
import { UserService } from "./user.service";

export default class TeamService {
	private teamRepository: Repository<Team>;
	private memberRepository: Repository<TeamMember>;
	private redis;

	constructor() {
		this.teamRepository = Database.datasource!.getRepository(Team);
		this.memberRepository = Database.datasource!.getRepository(TeamMember);
		this.redis = Redis.getClient();
	}

	async getTeams(owner: User) {
		return await this.teamRepository.query("SELECT * FROM teams WHERE ownerid = ?", [owner.id]);
	}

	async getTeam(teamId: number): Promise<Team | null> {
		const query = `SELECT 
				team.id,
				team.name,
				JSON_AGG(json_build_object('id', m.id, 'name', u.name, 'email', u.email)) as members
			FROM teams team 
				LEFT JOIN team_member m ON m.teamid = team.id 
				LEFT JOIN users u ON m.userid = u.id
			WHERE team.id = $1
			GROUP BY team.id`;

		const data = await this.teamRepository.query(query, [teamId]);
		if (data.length < 1) return null;
		return data[0];
	}

	async sendTeamInvite(
		team: Team,
		email: string,
		options = {
			existingUser: false,
		}
	) {
		try {
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

			let link = `${
				process.env.NODE_ENV == "production" ? "https://lags.vercel.app" : "http://localhost:5173"
			}/accept-invite/?token=${token}&email=${email}`;

			if (options.existingUser == false) {
				link += `&new`;
			}

			return await Mailer.send(
				email,
				`<p>You've been invited to join <b>${team.name}</b> on LAAS. Click <a href='${link}'>here</a> to join or ignore this e-mail. This invite will expire in 30 minutes.</p>`,
				"You've been invited."
			);
		} catch (err) {
			console.error(err);
		}
	}

	async acceptInvite(req: Request) {
		const { token, email, password, password_confirmation } = req.body;

		let isNew = "new" in req.body;

		if (isNew) {
			const passwordsPresent = "password" in req.body && "password_confirmation" in req.body;

			if (!passwordsPresent || password !== password_confirmation)
				return {
					status: 400,
					data: {
						message: "Password required",
					},
				};
		}

		const userService = new UserService();

		try {
			const redis = Redis.getClient()!;
			const cacheKey = `teams:invite-to-${token}-email-${email}`;
			let data = await redis.get(cacheKey);

			if (!data) {
				return {
					status: 404,
					data: {
						message: "Invite not found.",
					},
				};
			}

			const invite = JSON.parse(data);
			const team = await this.getTeam(invite!.teamId);

			if (!team) {
				return { status: 400, data: { message: "Malformed invite." } };
			}

			let user = await userService.getUser({ where: { email: email as string } });
			if (user) isNew = false;

			if (!user) {
				user = await userService.createUser({
					email: email as string,
					name: "John doe",
					password,
				});
			}

			const isAlreadyMember = team.members.find((m: any, index: any) => m.userId == user?.id);

			if (isAlreadyMember) {
				redis.del(cacheKey);
				return { data: { message: "Already a member of this team" }, status: 400 };
			}

			const tMember = this.memberRepository.query(
				`INSERT INTO team_member (userid, teamid, status) VALUES ($1, $2, $3)`,
				[user.id, team.id, 1]
			);
			// const tMember = this.memberRepository.create({
			// 	team: team,
			// 	user: user,
			// });

			// await this.memberRepository.save(tMember);

			const auth = await userService.authenticate(user);

			redis.del(cacheKey);

			return {
				data: {
					message:
						"Invite accepted successfully. " +
						(isNew ? "Please set your password to continue." : ""),
					next: isNew ? "set_password" : undefined,
					auth,
				},
				status: 201,
			};
		} catch (error: any) {
			console.error(error);
			return {
				data: {
					message: error.message,
				},
				status: 500,
			};
		}
	}

	async getTeamApps(teamId: number, full = false) {
		const cacheKey = `team:${teamId}:apps`;
		let apps: any = await this.redis?.get(cacheKey);

		if (full) {
			const data = await this.teamRepository.query(
				`SELECT app.id, app.title, app.token, app.createdat FROM team_apps ta
				JOIN apps app ON ta.apid = app.id 
			WHERE ta.teamid = ?`,
				[teamId]
			);

			return data;
		}

		if (apps == null || apps == undefined) {
			const data = await this.teamRepository.query(
				"SELECT appid FROM team_apps ta WHERE teamid = ?",
				[teamId]
			);

			await this.redis!.setex(cacheKey, 60 * 5, JSON.stringify(data));
			return data.map((a: any) => a.appId);
		}

		apps = JSON.parse(apps);
		return apps!.map((a: any) => a.appId);
	}

	async getAppTeam(appId: number) {
		const team = await this.teamRepository.query("SELECT teamid FROM team_apps WHERE appid = ?", [
			appId,
		]);

		return team;
	}

	async getParticipatingTeams(user: User) {
		try {
			const sql = `SELECT t.id, t.name, t.createdAt FROM teams t LEFT JOIN team_member TM ON TM.teamid = t.id AND TM.userid = $1 LEFT JOIN users u ON u.id = TM.userid`;
			const teams = await this.teamRepository.query(sql, [user.id]);
			return teams;
		} catch (err) {
			console.error(err);
			return [];
		}
	}
}
