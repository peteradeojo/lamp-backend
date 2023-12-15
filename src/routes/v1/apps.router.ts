import { Router } from "express";
import Joi from "joi";

import { AppService } from "../../services/apps.service";
import { User } from "../../typeorm/entities/User";
import {
	validateSchema as validateBody,
	validateQuerySchema,
} from "../../middleware/ValidateSchema";
import { Database } from "@lib/database";
import TeamService from "@services/teams.service";
import { In } from "typeorm";

const router = Router();

export default function appsRouter(): Router {
	const appService = new AppService();
	const teamService = new TeamService();

	router.get(
		"/",
		validateQuerySchema(
			Joi.object({
				teamId: Joi.number().optional(),
			})
		),
		async (req, res) => {
			const { teamId } = req.query;

			try {
				if (teamId) {
					const teams = await Database.datasource!.query(
						"SELECT * FROM team_member WHERE userId = ? AND teamId = ?",
						[req.user!.id, teamId]
					);

					if (teams.length < 1) {
						return res.status(403).json({ message: "You no wise" });
					}

					const appIds = await teamService.getTeamApps(Number(teamId));
					const apps = await appService.getApps({ id: In(appIds) });
					return res.json({ data: apps, message: "Apps fetched successfully." });
				}

				const apps = await appService.getUserApps(
					(req.user as User).id,
					parseInt(teamId as string)
				);

				return res.json({ message: "", data: apps });
			} catch (error: any) {
				return res.json({ message: error.message, data: {} });
			}
		}
	);

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
				const app = await appService.createApp(req.user!.id, title);

				return res.json({ message: "Success", data: { app } });
			} catch (err: any) {
				return res.status(500).json({ message: err.message });
			}
		}
	);

	router.get("/:id", async (req, res) => {
		const { id } = req.params;
		try {
			const app = await appService.getApp(parseInt(id));

			const canView = await appService.canUseApp(Number(id), req.user!)
			if (!app) {
				return res.status(404).json({ message: "App `id` invalid", data: {} });
			}
			if (app.user.id !== (req.user as User).id && !canView) {
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

	router.post(
		"/add-to-team",
		validateBody(
			Joi.object({
				app: Joi.number().required(),
				team: Joi.number().required(),
			})
		),
		async (req, res) => {
			const { app: appId, team: teamId } = req.body;

			const app = await appService.getApp(appId);

			if (!app) {
				return res.status(400).json({ message: "Bad Request. Check if app id is valid." });
			}

			if (app.user.id != req.user!.id) {
				return res.status(403).json({ message: "Forbidden" });
			}

			const team = await Database.datasource!.query("SELECT * FROM teams WHERE id = ?", [teamId]);
			if (team.length < 1 || team[0].ownerId !== req.user!.id) {
				return res.status(400).json({ message: "Forbidden" });
			}

			try {
				const response = await appService.addAppToTeam(app.id, team[0].id);
				return res.json({ message: "Successful" });
			} catch (error: any) {
				return res.status(500).json({ message: "Something went wrong. " + error.message });
			}
		}
	);

	return router;
}
