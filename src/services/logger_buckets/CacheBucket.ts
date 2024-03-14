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
		await CacheBucket.cacheClient.rpush("system_logs", JSON.stringify(log));
		return true;
	}

	async getLogs(): Promise<Log[]> {
		const logs = await CacheBucket.cacheClient.lrange("system_logs", 0, 100);
		return logs.map((v) => JSON.parse(v));
	}
}
