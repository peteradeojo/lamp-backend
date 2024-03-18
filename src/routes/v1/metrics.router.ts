import { AppService } from "@services/apps.service";
import { Logger } from "@services/logger.service";
import { MetricService } from "@services/metrics.service";
import TeamService from "@services/teams.service";
import { Router } from "express";

const debug = require('debug')('app:metrics-router');

const appService = new AppService();
const teamService = new TeamService();
const metricService = new MetricService();
const router = Router();
export default function metricsRouter() {
	router.get("/", async (req, res) => {
		try {
			const { team } = req.query;
			console.log(team);
			let apps;
			if (team) {
				apps = await teamService.getTeamApps(Number(team), true)
			} else {
				apps = await appService.getUserApps((req.user as any).id);
			}

			const metrics = await metricService.getSummary(apps);

			return res.json(metrics);
		} catch (err: any) {
			Logger.systemError(err);
			debug(err);
			return res.status(500).json({ message: "An error occurred" });
		}
	});

	router.get("/:appId", async (req, res) => {
		try {
			const { appId } = req.params;
			const { range, interval } = req.query;
			const metrics = await metricService.getAppSummary(appId, range as any, interval as any);

			return res.json({ data: metrics });
		} catch (error) {
			Logger.systemError(error as any);
			debug(error);
			return res.status(500).json({ error });
		}
	});

	return router;
}
