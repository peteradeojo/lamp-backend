import { Log, LogType } from "../typeorm/entities/Log";
import { FindOptionsWhere, Like, Repository } from "typeorm";
import { Database } from "../lib/database";
import { App } from "../typeorm/entities/App";

export type LogData = {
	level: LogType;
	text: string;
	ip?: string;
	tags?: string[];
	context?: string;
	app: App;
};

export class LogService {
	private logsRepository: Repository<Log>;

	constructor() {
		this.logsRepository = Database.datasource!?.getRepository(Log);
	}

	private async initialize() {
		if (!this.logsRepository) {
			this.logsRepository = Database.datasource!?.getRepository(Log);
		}
	}

	async getLogs(
		appId: number,
		query: {
			page?: number;
			count?: number;
			level?: LogType;
			tags?: string[];
			search?: string;
		}
	): Promise<{
		data: Log[];
		total: number;
		page: number | string;
		count: number;
	}> {
		const skip = (query.page || 1) - 1;
		const offset = skip * (query.count || 20);

		const where: FindOptionsWhere<Log> | FindOptionsWhere<Log>[] = {
			app: { id: appId },
		};
		if (query.level) {
			where["level"] = query.level;
		}

		if (query.search) {
			where["text"] = Like(`${query.search}%`);
		}

		await this.initialize();
		const logs = await this.logsRepository.find({
			where,
			skip: offset,
			take: query.count || 20,
			order: { createdAt: "DESC" },
		});

		return {
			data: logs,
			total: logs.length,
			page: query?.page || 1,
			count: query?.count || 20,
		};
	}

	async saveLog(logData: LogData) {
		await this.initialize();
		const log = this.logsRepository.create({
			...logData,
		});

		await this.logsRepository.save(log);
	}

	async deleteLogs(appId: number) {
		await this.initialize();
		await this.logsRepository.delete({ app: { id: appId } });
	}

	async deleteLog(logId: number) {
		await this.initialize();
		await this.logsRepository.delete({ id: logId });
	}
}
