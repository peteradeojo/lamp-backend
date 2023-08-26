import path from "path";
import cron from "node-cron";
import { format, subMinutes } from "date-fns";

if (process.env.NODE_ENV == "development") {
	require("dotenv").config({
		path: path.resolve(__dirname, "../.env"),
	});
}

import { Database } from "@lib/database";
import { MetricDataSource } from "typeorm/data-source";
import { Metrics } from "@entities/Metrics";

(async () => {
	try {
		await Database.initialize(MetricDataSource);

		const queryRunner = Database.getDatasource()!.createQueryRunner();
		const metricManager = Database.datasource!.manager;

		cron.schedule("*/30 * * * *", async () => {
			const date = subMinutes(new Date(), 30);
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
				console.log(`Generated ${result.raw.affectedRows} rows of metric data`);
				return;
			}

      console.log("No metrics gathered");
		});
	} catch (err) {
		console.error(err);
	}
})();
