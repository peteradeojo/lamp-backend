import { Database } from "@lib/database";
import { LogBucket, Log } from "@services/logger.service";
import { AppDataSource } from "../../typeorm/data-source";
import { SystemLog } from "@entities/SystemLogs";
import { FindOptionsWhere } from "typeorm";

export default class DatabaseBucket
	implements LogBucket<FindOptionsWhere<SystemLog>, SystemLog | Log>
{
	private repository;

	constructor() {
		this.repository = Database.datasource!.getRepository(SystemLog);
	}

	async save(log: Log): Promise<boolean> {
		const datasource = Database.getDatasource()!;
		const queryRunner = datasource.createQueryRunner();

		try {
			const r = await queryRunner.query(
				"INSERT INTO system_logs (text, level, context, stack, from_user, from_system) VALUES ($1, $2, $3, $4, $5, $6)",
				[
					log.text,
					log.level,
					JSON.stringify(log.context),
					log.stack,
					log.from_user,
					log.from_system,
				]
			);
			return true;
		} catch (err) {
			console.error(err);
			return false;
		}
	}

	async connect(): Promise<boolean> {
		await Database.initialize(AppDataSource);
		return true;
	}

	async fetchLogs(
		query: FindOptionsWhere<SystemLog>,
		options = {
			page: 1,
			count: 20,
		}
	): Promise<(SystemLog | Log)[]> {
		if (!options.page || options.page < 1) options.page = 1;
		if (!options.count || options.count < 1) options.count = 20;

		const systemLogs = await this.repository.find({
			where: query,
			skip: (options.page - 1) * options.count,
			take: options.count,
		});

		return systemLogs;
	}

	async getTotalLogs(query: any) {
		return await this.repository.count({ where: query });
	}

	async clear() {
		return await this.repository.delete({});
	}
}
