import { Metrics } from "@entities/Metrics";
import { Database } from "@lib/database";
import { Repository } from "typeorm";

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
