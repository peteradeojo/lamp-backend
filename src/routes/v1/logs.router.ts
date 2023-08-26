import { Router } from "express";
import Joi from "joi";
import passport from "passport";

import { LogService } from "../../services/logs.service";
import {
	validateParamsSchema,
	validateSchema as validateBody,
} from "../../middleware/ValidateSchema";
import { AppService } from "../../services/apps.service";
import { LogType } from "../../typeorm/entities/Log";
import { IoManager } from "@lib/iomanager";

const router = Router();

const logService = new LogService();
const appService: Pick<AppService, "getAppByToken"> = new AppService();

export default function logsRouter() {
	router.post(
		"/",
		validateBody(
			Joi.object({
				text: Joi.string().required(),
				level: Joi.string().required(),
				ip: Joi.string().optional(),
				tags: Joi.array().optional(),
				context: Joi.object().optional(),
			})
		),
		async (req, res) => {
			const app = await appService.getAppByToken(req.headers.APP_ID as string);
			const io = IoManager.getInstance();
			if (!app) {
				return res.status(401).json({ error: "App not found" });
			}

			if (!Object.values(LogType).includes(req.body.level as LogType)) {
				req.body.level = "unknown";
			}

			try {
				const log = await logService.saveLog({
					app: { id: app.id },
					...req.body,
					ip: req.ip,
				});

				IoManager.sendTo('log', log.app.id, log);
				return res.json({ ok: true });
			} catch (err: any) {
				return res.status(500).json({ error: err.message });
			}
		}
	);

	router.get(
		"/:app_id",
		passport.authenticate("jwt", { session: false }),
		validateParamsSchema(
			Joi.object({
				app_id: Joi.number().required(),
			})
		),
		async (req, res) => {
			const { app_id } = req.params;
			const logs = await logService.getLogs(parseInt(app_id), req.query);
			return res.json(logs);
		}
	);

	router.delete(
		"/:log_id/delete",
		passport.authenticate("jwt", { session: false }),
		validateParamsSchema(
			Joi.object({
				log_id: Joi.number().required(),
			})
		),
		async (req, res) => {
			const { log_id } = req.params;
			await logService.deleteLog(parseInt(log_id));

			return res.json({ ok: true });
		}
	);

	router.delete(
		"/:app_id",
		passport.authenticate("jwt", { session: false }),
		validateParamsSchema(
			Joi.object({
				app_id: Joi.number().required(),
			})
		),
		async (req, res) => {
			const { app_id } = req.params;
			await logService.deleteLogs(parseInt(app_id));

			return res.json({ ok: true });
		}
	);

	return router;
}
