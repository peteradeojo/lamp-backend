import AiService from "@services/ai.service";
import { LogService } from "@services/logs.service";
import { Router } from "express";
import Joi from "joi";

const router = Router();

const aiService = new AiService();
const logsService = new LogService();

export default function () {
	router.post(
		"/",
		(req, res, next) => {
			const schema = Joi.object({
				ids: Joi.array<string>().min(1).required(),
				appId: Joi.number().required(),
			});

			const { error } = schema.validate(req.body);
			if (error) {
				return res.status(400).json(error.details);
			}

			return next();
		},
		async (req, res) => {
			try {
				const logs = await logsService.fetchLogs(
					req.body.ids,
					(req.user as any).id,
					req.body.appId
				);

				const response = await aiService.sendChat(logs);

				return res.json(response);
			} catch (err: any) {
				return res.status(500).json({ message: err.message });
			}
		}
	);

	return router;
}
