import { AppService } from "@services/apps.service";
import { Router } from "express";

const router = Router();

const appService = new AppService();

export default function profileRouter() {
	router.get("/", async (req, res) => {
		const apps = await appService.getUserApps((req.user as any).id);

		return res.json({ user: req.user, apps });
	});

	return router;
}
