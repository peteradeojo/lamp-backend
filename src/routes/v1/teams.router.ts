import Team from "@entities/Team";
import { Database } from "@lib/database";
import { validateParamsSchema, validateSchema } from "@middleware/ValidateSchema";
import TeamService from "@services/teams.service";
import { UserService } from "@services/user.service";
import { Router } from "express";
import Joi from "joi";

const router = Router();

export default () => {
	const userService = new UserService();
	const teamService = new TeamService();

	router.get("/", async (req, res) => {
		if ("mine" in req.query) {
			const data = await teamService.getTeams(req.user!);
			return res.json(data);
		} else {
			const data = await teamService.getParticipatingTeams(req.user!);
			return res.json(data);
		}
	});
	router.get(
		"/:id/show",
		validateParamsSchema(
			Joi.object({
				id: Joi.number().required(),
			})
		),
		async (req, res) => {
			const data = await teamService.getTeam(Number(req.params.id));
			return res.json(data);
		}
	);

	router.get(
		"/:id/apps",
		validateParamsSchema(
			Joi.object({
				id: Joi.number().required(),
			})
		),
		async (req, res) => {
			const data = await teamService.getTeamApps(Number(req.params.id), true);
			return res.json(data);
		}
	);

	router.post(
		"/new",
		validateSchema(
			Joi.object({
				name: Joi.string().required(),
				apps: Joi.array().items(Joi.number()),
			})
		),
		async (req, res) => {
			const data = await userService.createTeam(req.user!, { name: req.body.name, apps: req.body.apps });

			return res.json(data);
		}
	);

	router.post(
		"/add-member",
		validateSchema(
			Joi.object({
				team: Joi.number().required(),
				email: Joi.string().email().required(),
			})
		),
		async (req, res) => {
			const { team: teamId, email } = req.body;

			let teams = await Database.datasource!.query(
				"SELECT t.* FROM teams t WHERE t.ownerid = $1 and t.id = $2",
				[req.user!.id, teamId]
			);

			if (teams.length < 0) {
				return res.json();
			}

			const user = await userService.getUser({ where: { email } });

			// Check if user is already a member of this team
			const team = await teamService.getTeam(teams[0].id);
			if (!team) {
				return res.status(400).json({ message: "Team does not exist" });
			}
			const isMember = team!.members.find(
				(member: any, index: number) => member.email == user?.email
			);
			if (isMember) {
				return res.status(400).json({ message: "Already a member." });
			}

			await teamService.sendTeamInvite(team!, req.body.email, {
				existingUser: Boolean(user),
			});
			return res.json({
				message: "Invite sent",
			});
		}
	);

	return router;
};
