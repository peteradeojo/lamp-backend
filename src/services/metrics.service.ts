import { App } from "@entities/App";
import { Metrics } from "@entities/Metrics";
import { Database, Redis } from "@lib/database";
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
		const redis = new Redis();
		const ids = apps.map((app) => app.id);

		const cacheKey = `metrics-summary:${ids.join('-')}`;
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		const query = Database.datasource!.createQueryRunner();
		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = format(subWeeks(new Date(), 1), "yyyy-MM-dd 23:59:59");

		// const data = await query.query(`SELECT l.level, count(l.id) weight, l.appId, a.title app from logs l LEFT JOIN apps a ON a.id = l.appId WHERE (l.createdAt >= ? and l.createdAt <= ?) AND appId IN (?) GROUP BY appId, level`, [before, date, ids]);

		const data = await Promise.all(
			apps.map(async (app) => {
				try {
					return {
						app: app.title,
						appId: app.id,
						data: await query.query(
							`SELECT l.level, count(l.id) weight from logs l LEFT JOIN apps a ON a.id = l.appId WHERE (l.createdAt >= ? and l.createdAt <= ?) AND appId = ? GROUP BY appId, level`,
							[before, date, app.id]
						),
					};
				} catch (err: any) {
					console.error(err);
					return {
						app: app.title,
						appId: app.id,
						data: [],
					};
				}
			})
		);

		await redis.put(cacheKey, JSON.stringify(data), 60 * 10);

		return data;
	}

	public async getAppSummary(appId: string, timerange: string = "1d") {
		const queryRunner = Database.datasource!.createQueryRunner();

		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = format(subWeeks(new Date(), 1), "yyyy-MM-dd 23:59:59");
		const data: { level: string; weight: number; createdAt: string }[] = await queryRunner.query(
			"SELECT level, count(level) weight, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') createdAt FROM logs WHERE (createdAt BETWEEN ? AND ?) AND appId = ? GROUP BY level, DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') ORDER BY createdAt",
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
