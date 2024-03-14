import { LogBucket, Log } from "@services/logger.service";
import { Redis as RedisType } from "ioredis";
import { Redis } from "@lib/database";

export default class CacheBucket implements LogBucket {
	private static cacheClient: RedisType;
	constructor() {
		CacheBucket.cacheClient = Redis.getClient()!;
	}

	async connect(): Promise<boolean> {
		return false;
	}

	async save(log: Log): Promise<boolean> {
		log.createdat = new Date();
		log.updatedat = new Date();
		await CacheBucket.cacheClient.rpush("system_logs", JSON.stringify(log));
		return true;
	}

	async getLogs(): Promise<Log[]> {
		const logs = await CacheBucket.cacheClient.lrange("system_logs", 0, 100);
		return logs.map((v) => JSON.parse(v));
	}

	async fetchLogs(query: any, options?: any): Promise<Log[]> {
		return this.getLogs();
	}

	async clear() {
		// await CacheBucket.cacheClient.lrem("system_logs", )
	}
}
