import { AppService } from "@services/apps.service";
import { MetricService } from "@services/metrics.service";
import { Router } from "express";

const appService = new AppService();
const metricService = new MetricService();
const router = Router();
export default function metricsRouter() {
	router.get("/", async (req, res) => {
		try {
			const apps = await appService.getUserApps((req.user as any).id);
			const metrics = await metricService.getSummary(apps);
	
			return res.json(metrics);
		} catch (err: any) {
			console.log(err.message);
			return res.status(500).json({message: "An error occurred"});
		} 
	});

	router.get("/:appId", async (req, res) => {
		const { appId } = req.params;
		const metrics = await metricService.getAppSummary(appId);

		return res.json({ data: metrics });
	});

	return router;
}
