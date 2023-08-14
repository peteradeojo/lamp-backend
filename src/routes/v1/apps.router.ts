import { Router } from "express";
import Joi from "joi";

import { AppService } from "../../services/apps.service";
import { User } from "../../typeorm/entities/User";
import { validateSchema as validateBody } from "../../middleware/ValidateSchema";

const debug = require("debug")("app:apps-router");

const router = Router();

const appService = new AppService();
export default function appsRouter (): Router {
	router.get("/", async (req, res) => {
		try {
			const apps = await appService.getUserApps((req.user as User).id);

			return res.json({ message: "", data: { apps } });
		} catch (error: any) {
			return res.json({ message: error.message, data: {} });
		}
	});

	router.post(
		"/",
		validateBody(
			Joi.object({
				title: Joi.string().required(),
			}).required()
		),
		async (req, res) => {
			const { title } = req.body;
			try {
				const app = await appService.createApp((req.user as User).id, title);

				return res.json({ message: "", data: { app } });
			} catch (err: any) {
				return res.status(500).json({ message: err.message });
			}
		}
	);

	router.get("/:id", async (req, res) => {
		const { id } = req.params;
		try {
			const app = await appService.getApp(parseInt(id));

			if (app && app.user.id !== (req.user as User).id) {
				return res.status(403).json({ message: "Forbidden", data: {} });
			}

			return res.json({ message: "", data: app });
		} catch (err: any) {
			return res.json({ message: err.message, data: {} });
		}
	});

	router.post("/:id/token", async (req, res) => {
		const { id } = req.params;
		try {
			const token = await appService.updateAppToken(parseInt(id));

			return res.json({
				message: "App token updated successfully",
				data: { token },
			});
		} catch (err: any) {
			return res.json({ message: err.message, data: {} });
		}
	});

	router.patch(
		"/:id/update",
		validateBody(Joi.object({ title: Joi.string().required().trim() })),
		async (req, res) => {
			const { id } = req.params;

			try {
				const app = await appService.updateApp(parseInt(id), req.body.title);

				return res.json({ message: "App updated successfully", data: { app } });
			} catch (err: any) {
				return res.json({ message: err.message });
			}
		}
	);

	return router;
}
