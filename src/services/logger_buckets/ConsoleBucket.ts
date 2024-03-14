import { LogBucket, Log } from "@services/logger.service";

const debug = require("debug")("app:console-logger");

export default class ConsoleBucket implements LogBucket<any, any> {
	save(log: Log): boolean | Promise<boolean> {
		debug(log);
		return true;
	}

	connect(): boolean | Promise<boolean> {
		return true;
	}

	async fetchLogs(query: any, options?: any): Promise<never[]> {
		return [];
	}
}
