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
		const ids = apps.map((app) => app.id);

		const query = Database.datasource!.createQueryRunner();
		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = format(subWeeks(new Date(), 1), "yyyy-MM-dd 23:59:59");

		const data = await query.query(`SELECT l.level, count(l.id) weight, l.appId, a.title app from logs l LEFT JOIN apps a ON a.id = l.appId WHERE (l.createdAt >= ? and l.createdAt <= ?) AND appId IN (?) GROUP BY appId, level`, [before, date, ids]);

		return data;
	}

	public async getAppSummary(appId: string, timerange: string = "1d") {
		const queryRunner = Database.datasource!.createQueryRunner();

		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = format(subWeeks(new Date(), 1), "yyyy-MM-dd 23:59:59");
		const data: { level: string; weight: number, createdAt: string }[] = await queryRunner.query(
			"SELECT level, count(id) weight, max(createdAt) createdAt FROM logs WHERE (createdAt BETWEEN ? AND ?) AND appId = ? GROUP BY level, createdAt ORDER BY createdAt DESC",
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
