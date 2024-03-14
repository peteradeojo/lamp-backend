import { LogType } from "@entities/Log";

import CacheBucket from "./logger_buckets/CacheBucket";
import DatabaseBucket from "./logger_buckets/DatabaseBucket";
import ConsoleBucket from "./logger_buckets/ConsoleBucket";

type Booleanable = boolean | number;

export interface Log {
	level: Omit<LogType, "critical" | "warn">;
	text: string;
	context?: any;
	stack?: string;
	from_system?: Booleanable;
	from_user?: Booleanable;
	createdat?: Date;
	updatedat?: Date;
}

export interface LogBucket<T = any, L = Log> {
	connect(): boolean | Promise<boolean>;
	save(log: Log): boolean | Promise<boolean>;

	fetchLogs(query: T, options?: any): Promise<L[]>;
}

export class Logger {
	public static getLogBucket(strategy?: string): LogBucket {
		const channel = strategy || process.env.LOG_BUCKET;

		switch (channel) {
			case "database":
				return new DatabaseBucket();
			case "cache":
				return new CacheBucket();
			default:
				return new ConsoleBucket();
		}
	}

	private static async log(log: Log) {
		const bucket = this.getLogBucket();
		bucket.save(log);
	}

	private static buildLog(level: string, message: string, context?: any, stack?: string): Log {
		const log: Log = {
			text: message,
			level,
			context,
			stack,
			from_user: 1,
			from_system: 0,
		};
		return log;
	}

	private static buildSystemLog(
		level: string,
		message: string,
		context?: any,
		stack?: string
	): Log {
		const log = this.buildLog(level, message, context, stack);
		log.from_user = 0;
		log.from_system = 1;

		return log;
	}

	public static critical(err: any, message?: string, context?: any) {
		const log = this.buildLog("fatal", message || err.message, context, err.stack);

		this.log(log);
	}

	public static error(err: any, message?: string, context?: any) {
		const log = this.buildLog("error", message || err.message, context, err.stack);

		this.log(log);
	}

	public static info(err: any, message?: string, context?: any) {
		const log = this.buildLog("info", message || err.message, context, err.stack);

		this.log(log);
	}

	public static debug(err: any, message?: string, context?: any) {
		const log = this.buildLog("debug", message || err.message, context, err.stack);

		this.log(log);
	}

	public static systemError(err: any, message?: string, context?: any) {
		this.log(this.buildSystemLog("error", message || err.message, context, err.stack));
	}
	public static systemInfo(err: any, message?: string, context?: any) {
		this.log(this.buildSystemLog("info", message || err.message, context, err.stack));
	}
	public static systemDebug(err: any, message?: string, context?: any) {
		this.log(this.buildSystemLog("debug", message || err.message, context, err.stack));
	}
}
