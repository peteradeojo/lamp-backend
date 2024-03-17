import { App } from "@entities/App";
import { Metrics } from "@entities/Metrics";
import { Database, Redis } from "@lib/database";
import { format, subDays, subHours, subWeeks } from "date-fns";
import { Repository } from "typeorm";
import { Logger } from "./logger.service";

type Interval = "daily" | "monthly" | "hourly";

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

		return format(sub(from, num), "yyyy-MM-dd");
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
		const before = this.getBeforeDate(subWeeks(new Date(), 3));

		const data = await Promise.all(
			apps.map(async (app) => {
				try {
					return {
						app: app.title,
						appId: app.id,
						data: await query.query(
							`SELECT l.level, count(l.id) weight from logs l LEFT JOIN apps a ON l.appToken = a.token WHERE (l.createdAt >= $1 and l.createdAt <= $2) AND l.apptoken = $3 GROUP BY apptoken, level LIMIT 10000`,
							[before, date, app.token]
						),
					};
				} catch (err: any) {
					Logger.systemError(err);
					return {
						app: app.title,
						appId: app.id,
						data: [],
					};
				}
			})
		);

		if (process.env.NODE_ENV == "production") {
			redis.put(cacheKey, JSON.stringify(data), 60 * 5);
		}

		return data;
	}

	private resolveIntervalFormat(interval: Interval) {
		const base = "YEAR(createdAt), ";
		switch (interval) {
			case "daily":
				return ["%Y-%m-%d 00:00:00", base + "MONTH(createdAt), DAY(createdAt)"];
			case "hourly":
				return ["%Y-%m-%d %H:00:00", base + "MONTH(createdAt), DAY(createdAt), HOUR(createdAt)"];
			case "monthly":
				return ["%Y-%m-01 00:00:00", base + "MONTH(createdAt)"];
			default:
				return [
					"%Y-%m-%d %H:%i:00",
					base + "MONTH(createdAt), DAY(createdAt), HOUR(createdAt), MINUTE(createdAt)",
				];
		}
	}

	public async getAppSummary(
		appId: string,
		timerange: string = "1d",
		interval: Interval = "hourly"
	) {
		const redis = new Redis();
		const cacheKey = `app-summary-${appId}-${timerange}-${interval}`;
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		const queryRunner = Database.datasource!.createQueryRunner();
		const date = format(new Date(), "yyyy-MM-dd 23:59:59");

		const before = this.getBeforeDate(new Date(), timerange);

		const assist = this.resolveIntervalFormat(interval);
		const data: { level: string; weight: number; createdAt: string }[] = await queryRunner.query(
			`SELECT level, count(id) weight, MAX(DATE_FORMAT(createdAt, '${assist[0]}')) createdAt FROM logs WHERE (createdAt BETWEEN ? AND ?) AND appId = ? GROUP BY level, ${assist[1]};`,
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
