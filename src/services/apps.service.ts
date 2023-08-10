import { Repository } from "typeorm";
import { Database } from "../lib/database";
import { App } from "../typeorm/entities/App";
import { v4 as uuid } from "uuid";

export class AppService {
	private appRepository: Repository<App>;

	constructor() {
		this.appRepository = Database.datasource?.getRepository(App)!;
	}

	private async initialize() {
		if (!this.appRepository) {
			this.appRepository = Database.datasource?.getRepository(App)!;
		}
	}

	async getUserApps(id: number) {
		await this.initialize();
		const apps = await this.appRepository.findBy({ user: { id } });
		return apps;
	}

	async createApp(userId: number, title: string) {
		await this.initialize();
		const app = this.appRepository.create({ title, user: { id: userId } });
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
}
