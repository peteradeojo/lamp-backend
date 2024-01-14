import { App } from "@entities/App";
import { Metrics } from "@entities/Metrics";
import { Database, Redis } from "@lib/database";
import { format, subDays, subHours, subWeeks } from "date-fns";
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

	private getBeforeDate(from: Date, timerange = "1d") {
		// @ts-ignore
		const [source, num, period, ...rest] = /^(\d+)(w|d|h)$/.exec(timerange);

		let sub = undefined;
		switch (period) {
			case "d":
				sub = subDays;
				break;
			case "w":
				sub = subWeeks;
				break;
			case "h":
				sub = subHours;
				break;
			default:
				sub = subDays;
		}

		return format(sub(from, num), "yyyy-MM-dd HH:mm:ss");
	}

	public async getSummary(apps: App[]) {
		const redis = new Redis();
		const ids = apps.map((app) => app.id);

		const cacheKey = `metrics-summary:${ids.join("-")}`;
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		const query = Database.datasource!.createQueryRunner();
		const date = format(new Date(), "yyyy-MM-dd 23:59:59");
		const before = this.getBeforeDate(new Date());

		const data = await Promise.all(
			apps.map(async (app) => {
				try {
					return {
						app: app.title,
						appId: app.id,
						data: await query.query(
							`SELECT l.level, count(l.id) weight from logs l LEFT JOIN apps a ON a.id = l.appId WHERE (l.createdAt >= ? and l.createdAt <= ?) AND appId = ? GROUP BY appId, level LIMIT 10000`,
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

		redis.put(cacheKey, JSON.stringify(data), 60 * 5);

		return data;
	}

	public async getAppSummary(appId: string, timerange: string = "2h") {
		const redis = new Redis();
		const cacheKey = `app-summary-${appId}-${timerange}`;
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		const queryRunner = Database.datasource!.createQueryRunner();
		const date = format(new Date(), "yyyy-MM-dd 23:59:59");

		const before = this.getBeforeDate(new Date(), timerange);
		console.log(before);

		const data: { level: string; weight: number; createdAt: string }[] = await queryRunner.query(
			"SELECT level, count(level) weight, DATE_FORMAT(createdAt, '%Y-%m-%d %H') createdAt FROM logs WHERE (createdAt BETWEEN ? AND ?) AND appId = ? GROUP BY level, DATE_FORMAT(createdAt, '%Y-%m-%d %H') ORDER BY createdAt LIMIT 10000",
			[before, date, appId]
		);

		redis.put(cacheKey, JSON.stringify(data), 60 * 5);

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
