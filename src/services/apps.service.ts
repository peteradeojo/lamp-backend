import { Repository } from "typeorm";
import { Database } from "../lib/database";
import { App } from "../typeorm/entities/App";
import { v4 as uuid } from "uuid";

export class AppService {
	private appRepository: Repository<App>;
	private repo = App;

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

		let appCheck = await this.appRepository.countBy({
			title,
			user: { id: userId },
		});

		if (appCheck > 0) {
			throw new Error("App already exists");
		}

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
}