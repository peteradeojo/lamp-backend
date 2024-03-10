import { FindOptions, FindOptionsWhere, Repository } from "typeorm";
import { Database } from "../lib/database";
import { App } from "../typeorm/entities/App";
import { v4 as uuid } from "uuid";
import TeamService from "./teams.service";
import { User } from "@entities/User";

export class AppService {
	private appRepository: Repository<App>;
	private teamService: TeamService;

	constructor() {
		this.appRepository = Database.datasource?.getRepository(App)!;
		this.teamService = new TeamService();
	}

	private async initialize() {
		if (!this.appRepository) {
			this.appRepository = Database.datasource?.getRepository(App)!;
		}
	}

	async getUserApps(id: number, teamId: number | undefined = undefined) {
		await this.initialize();
		try {
			let query =
				"SELECT app.id, app.title, app.token, count(log.id) as total_logs, app.createdAt FROM apps app LEFT JOIN logs log ON log.apptoken = app.token";
			if (teamId) {
				query += " RIGHT JOIN team_apps ta ON ta.appid = app.id";
			}

			query += " WHERE app.userid = $1";
			if (teamId) {
				query += " AND ta.teamid = $2";
			}

			query += " GROUP BY app.id";

			const apps = this.appRepository.query(query, [id, teamId]);
			return apps;
		} catch (err: any) {
			console.error(err);
			return [];
		}
	}

	async createApp(userId: number, title: string) {
		await this.initialize();

		let appCheck = await this.appRepository.countBy({
			title,
			user: { id: userId },
		});

		if (appCheck > 0) {
			throw new Error("App already exists");
		}

		const app = this.appRepository.create({ title, user: { id: userId }, token: uuid() });
		await this.appRepository.save(app);

		return app;
	}

	async getApp(appId: number) {
		await this.initialize();
		return await this.appRepository.findOne({
			where: { id: appId },
			relations: ["user"],
		});
	}

	async updateAppToken(appId: number) {
		const appToken = uuid();
		await this.initialize();

		await this.appRepository.update({ id: appId }, { token: appToken });
	}

	async updateApp(appId: number, title: string) {
		await this.initialize();
		await this.appRepository.update({ id: appId }, { title });
	}

	async getAppByToken(token: string) {
		await this.initialize();
		return await this.appRepository?.findOne({
			where: { token: token },
		});
	}

	async getNumberOfApps(userId?: number) {
		await this.initialize();
		if (userId) {
			return await this.appRepository.countBy({ user: { id: userId } });
		}

		return await this.appRepository.count();
	}

	async addAppToTeam(app: number, team: number) {
		return Database.datasource!.transaction(async (manager) => {
			const query = "INSERT INTO team_apps (teamId, appId) VALUES (?, ?)";
			const result = await manager.query(query, [team, app]);

			return result;
		});
	}

	async getApps(where: FindOptionsWhere<App>) {
		return await this.appRepository.find({ where });
	}

	async canUseApp(appId: number, user: User) {
		const records = await this.appRepository.query(
			`
			SELECT a.* FROM apps a 
			JOIN team_apps ta ON ta.appId = a.id
			JOIN team_member tm ON tm.teamId = ta.teamId AND tm.userid = ?
			WHERE a.id = ?
		`,
			[user.id, appId]
		);

		if (records.length > 0) {
			// const app = records[0];
			return true;
		}

		// console.log(records);
		return false;
	}
}
