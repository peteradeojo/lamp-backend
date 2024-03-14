import { Database } from "@lib/database";
import { LogBucket, Log } from "@services/logger.service";
import { AppDataSource } from "typeorm/data-source";

export default class DatabaseBucket implements LogBucket {
	async save(log: Log): Promise<boolean> {
		const datasource = Database.getDatasource()!;
		const queryRunner = datasource.createQueryRunner();

		try {
			const r = await queryRunner.query(
				"INSERT INTO system_logs (text, level, context, stack, from_user, from_system) VALUES ($1, $2, $3, $4, $5, $6)",
				[log.text, log.level, JSON.stringify(log.context), log.stack, log.from_user, log.from_system]
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
}