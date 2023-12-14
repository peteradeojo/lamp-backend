import Team from "@entities/Team";
import TeamMember from "@entities/TeamMember";
import { User } from "@entities/User";
import { Database, Redis } from "@lib/database";
import { Repository, SelectQueryBuilder } from "typeorm";
import Mailer from "./mail.service";
import { randomUUID } from "crypto";
import { Request } from "express";
import { UserService } from "./user.service";

export default class TeamService {
	private teamRepository: Repository<Team>;
	private memberRepository: Repository<TeamMember>;
	// private appRepository: Repository<AppTeam>;
	private redis;

	constructor() {
		this.teamRepository = Database.datasource!.getRepository(Team);
		this.memberRepository = Database.datasource!.getRepository(TeamMember);
		this.redis = Redis.getClient();
		// this.appRepository = Database.datasource!.getRepository(AppTeam);
		// this.mailer = new Mailer();
	}

	async getTeams(owner: User) {
		return await this.teamRepository.query("SELECT * FROM teams WHERE ownerId = ?", [owner.id]);
	}

	async getTeam(teamId: number) {
		const query = `SELECT team.*, JSON_ARRAYAGG(
			JSON_OBJECT(
				'id', tm.id,
				'teamId', tm.teamId,
				'name', u.name,
				'email', u.email,
				'userId', u.id
			)
		) as members FROM teams team 
		LEFT JOIN team_member tm ON tm.teamId = team.id
		INNER JOIN users u ON tm.userId = u.id
		WHERE team.id = ?`;

		const data = await this.teamRepository.query(query, [teamId]);
		if (data.length < 1) return {};
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
		const { token, email } = req.query;

		let isNew = "new" in req.query;

		if (isNew) {
			const passwordsPresent = "password" in req.body && "password_confirmation" in req.body;

			if (!passwordsPresent)
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
				const { password } = req.body;
				user = await userService.createUser({
					email: email as string,
					name: "John doe",
					password,
				});
			}

			const isAlreadyMember = team.members.find((m: any, index: any) => m.userId == user?.id);

			if (isAlreadyMember) {
				redis.del(cacheKey);
				return { data: { message: "Invite expired." }, status: 401 };
			}

			const tMember = this.memberRepository.create({
				team: team,
				user: user,
			});

			await this.memberRepository.save(tMember);

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
}
