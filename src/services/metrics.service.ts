import { App } from "@entities/App";
import { Metrics } from "@entities/Metrics";
import { Database } from "@lib/database";
import { format, subDays, subWeeks } from "date-fns";
import { Repository } from "typeorm";

const debug = require("debug")("app:metrics-service");

export class MetricService {
	private metricRepository: Repository<Metrics>;

	constructor() {
		this.metricRepository = Database.datasource?.getRepository(Metrics)!;
	}

	private initialize() {
		if (!this.metricRepository) {
			this.metricRepository = Database.datasource!.getRepository(Metrics);
		}
	}

	public async getSummary(apps: App[]) {
		// this.initialize();
		const ids = apps.map((app) => app.id).join(",");

		const query = Database.datasource!.createQueryRunner();
		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = format(subWeeks(new Date(), 1), "yyyy-MM-dd 23:59:59");

		const sql = `SELECT m.level, sum(m.weight) weight FROM metrics m WHERE (m.createdAt BETWEEN ? AND ?) AND m.appId IN (?) GROUP BY m.level`;

		const data = await query.query(sql, [before, date, ids]);
		return data;
	}

	public async getAppSummary(appId: string, timerange: string = "1d") {
		const queryRunner = Database.datasource!.createQueryRunner();

		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = format(subWeeks(new Date(), 1), "yyyy-MM-dd 23:59:59");
		const data: { level: string; weight: number }[] = await queryRunner.query(
			"SELECT level, sum(weight) weight, max(createdAt) createdAt FROM metrics WHERE (createdAt BETWEEN ? AND ?) AND appId = ? GROUP BY level, createdAt ORDER BY createdAt DESC",
			[before, date, appId]
		);
		return data;
	}

	public async getMetrics() {
		this.initialize();
		const metrics = await this.metricRepository.find({
			order: {
				createdAt: "DESC",
			},
			take: 20,
		});

		return metrics;
	}
}
