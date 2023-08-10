import { DataSource } from "typeorm";
import { defaultRedisConfig } from "../config";
import redis, { Redis as RedisType } from "ioredis";

const debug = require("debug")("app:database");

export class Database {
	public static datasource?: DataSource;

	static async initialize(datasource: DataSource) {
    try {
			await datasource.initialize();
      Database.datasource = datasource;
      debug("Data source initialized");
		} catch (err) {
			debug(err);
		}
	}

	static getDatasource(): DataSource | null {
		return Database.datasource || null;
	}
}

interface CacheClient {
	put(
		key: string,
		value: string | number | Buffer,
		expiry?: number
	): Promise<void>;
	get(key: string): Promise<string | null>;
}

export class Cache {
	static client: CacheClient;

	static initialize() {
		Cache.client = new Redis();
	}

	static async put(
		key: string,
		value: string | number | Buffer,
		expiry?: number
	) {
		await Cache.client.put(key, value, expiry);
	}

	static async get(key: string): Promise<string | null> {
		return await Cache.client.get(key);
	}
}

export class Redis implements CacheClient {
	static client?: RedisType;

	constructor() {
		this.initialize();
	}

	initialize() {
		if (!Redis.client) {
			Redis.client = new redis(defaultRedisConfig);
			Redis.client.on("connect", () => debug("Redis client connected"));
		}
	}

	async put(key: string, value: string | number | Buffer, expiry?: number) {
		if (!Redis.client) {
			this.initialize();
		}

		if (expiry) {
			Redis.client!.setex(key, expiry, value);
		}
		Redis.client!.set(key, value);
	}

	async get(key: string): Promise<string | null> {
		const val = Redis.client!.get(key);
		return val;
	}
}
