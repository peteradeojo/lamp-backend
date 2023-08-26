import { MetricService } from "@services/metrics.service";
import { Router } from "express";

const metricService = new MetricService();
const router = Router();
export default function metricsRouter() {
	router.get("/", async (req, res) => {
		const metrics = await metricService.getMetrics();

		return res.json(metrics);
	});

	return router;
}
