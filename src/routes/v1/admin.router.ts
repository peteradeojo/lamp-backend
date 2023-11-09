import { Router } from "express";
import Joi from "joi";
import passport from "passport";

import adminUserRouter from "./admin/users.router";
import { validateQuerySchema, validateSchema } from "@middleware/ValidateSchema";
import { AppService } from "@services/apps.service";
import { UserService } from "@services/user.service";
import paymentsRouter from "./admin/payments.router";

const userService = new UserService();
const appService = new AppService();
const debug = require("debug")("app:admin-router");

export default function adminRouter() {
	const router = Router();

	router.get("/auth", passport.authenticate("admin", { session: false }), (req, res) => {
		return res.json(req.user);
	});

	router.post(
		"/auth/login",
		validateSchema(
			Joi.object({
				email: Joi.string().email().required(),
				password: Joi.string().required(),
			}).required()
		),
		async (req, res) => {
			const { email, password } = req.body;

			try {
				const result = await userService.authenticate(email, password);

				if (result && result.user) {
					if (!result.user.isAdmin) {
						return res.status(403).json({ message: "Forbidden" });
					}

					return res.json({ data: result });
				}

				return res.status(400).json({});
			} catch (err: any) {
				debug(err);
				return res.status(500).json({ message: err.message });
			}
		}
	);

	router.get(
		"/users",
		passport.authenticate("admin", { session: false }),
		validateQuerySchema(
			Joi.object({
				page: Joi.number().min(1).default(1),
				count: Joi.number().min(1).default(10),
				recent: Joi.boolean().optional().default(false),
			})
		),
		async (req, res) => {
			const {
				count = 20,
				page = 1,
				recent = false,
			}: { count?: number; page?: number; recent?: boolean } = req.query;

			const users = await userService.getAllUsers({ page, count, recent });

			return res.json({
				message: "Users fetched successfully",
				data: users,
				meta: {
					page,
					count,
					total: users.length,
					next: users.length === count ? `/admin/users?page=${page + 1}&count=${count}` : null,
					previous: page > 1 ? `/admin/users?page=${page - 1}&count=${count}` : null,
				},
			});
		}
	);

	router.use("/users", passport.authenticate("admin", { session: false }), adminUserRouter());

	router.use("/payments", passport.authenticate("admin", { session: false }), paymentsRouter());

	router.get("/analytics", passport.authenticate("admin", { session: false }), async (req, res) => {
		const appCount = await appService.getNumberOfApps();
		const userCount = await userService.getNumberOfUsers();

		return res.json({
			data: {
				apps: {
					total: appCount,
				},
				users: {
					total: userCount,
				},
			},
		});
	});

	return router;
}
