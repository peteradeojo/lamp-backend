import path from "path";
import cron from "node-cron";
import { format, subMinutes } from "date-fns";

if (process.env.NODE_ENV == "development") {
	require("dotenv").config({
		path: path.resolve(__dirname, "../.env"),
	});
}

const debug = require("debug")("app:collator");

import { Database } from "@lib/database";
import { MetricDataSource } from "./typeorm/data-source";
import { Metrics } from "@entities/Metrics";
import { EntityManager, QueryRunner } from "typeorm";

const minuteInterval = process.env.MINUTE_INTERVAL ? parseInt(process.env.MINUTE_INTERVAL) : 30;

const collate = async (queryRunner: QueryRunner, metricManager: EntityManager, minuteInterval: number) => {
	const date = subMinutes(new Date(), minuteInterval);

	const data: {
		level: string;
		weight: number;
		createdAt: Date;
		app: string | number;
	}[] = await queryRunner.query(
		"SELECT level, count(id) weight, appId app, max(createdAt) createdAt FROM logs log where createdAt >= ? GROUP BY log.appId, log.level",
		[format(date, "yyyy-MM-dd HH:mm:00")]
	);

	if (data.length > 0) {
		const result = await metricManager.insert(Metrics, data as any);
		debug(`Generated ${result.raw.affectedRows} rows of metric data`);
		return;
	}

	debug("No metrics gathered");
};

(async () => {
	try {
		await Database.initialize(MetricDataSource);

		const queryRunner = Database.getDatasource()!.createQueryRunner();
		const metricManager = Database.datasource!.manager;

		cron.schedule(`*/${minuteInterval} * * * *`, async () => {
			collate(queryRunner, metricManager, minuteInterval);
		});
	} catch (err) {
		console.error(err);
	}
})();
