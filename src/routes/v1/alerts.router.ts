import { validateQuerySchema } from "@middleware/ValidateSchema";
import { Logger } from "@services/logger.service";
import DatabaseBucket from "@services/logger_buckets/DatabaseBucket";
import { Router } from "express";
import Joi from "joi";

const router = Router();

export default () => {
	router.get(
		"/",
		validateQuerySchema(
			Joi.object({
				system: Joi.boolean().optional(),
				page: Joi.number().optional(),
				count: Joi.number().optional(),
			}),
			true
		),
		async (req, res) => {
			const bucket = new DatabaseBucket();
			const query: any = {};
			if (req.query.system) {
				if (req.query.system == "true") {
					query.from_system = 1;
				} else {
					query.from_user = 1;
				}
			}

			const logs = await bucket.fetchLogs(query, {
				page: Number(req.query.page) || 1,
				count: Number(req.query.count) || 20,
			});

			const total =await bucket.getTotalLogs(query);

			return res.json({
				data: logs,
				meta: {
					first_page: 1,
					page: req.query.page || 1,
					count: logs.length,
					total, 
					last_page: Math.ceil(total / Number(req.query.count || 20)),
				},
			});
		}
	);

	router.post("/clear", async (req, res) => {
		const bucket = new DatabaseBucket();
		bucket.clear();

		return res.json({ ok: true });
	});

	return router;
};
