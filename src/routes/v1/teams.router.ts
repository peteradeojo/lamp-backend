import Team from "@entities/Team";
import { Database } from "@lib/database";
import { validateSchema } from "@middleware/ValidateSchema";
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
			const data = await userService.getParticipatingTeams(req.user!);
			return res.json(data);
		}
	});

	router.post(
		"/new",
		validateSchema(
			Joi.object({
				name: Joi.string().required(),
			})
		),
		async (req, res) => {
			const data = await userService.createTeam(req.user!, { name: req.body.name });

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
				"SELECT t.* FROM teams t WHERE t.ownerId = ? and t.id = ?",
				[req.user!.id, teamId]
			);

			if (teams.length < 0) {
				return res.json();
			}

			const user = await userService.getUser({ where: { email } });
			const options: any = {};

			// Set options
			if (user) {
				options.existingUser = true;
			}

			// Check if user is already a member of this team
			const team = await teamService.getTeam(teams[0].id);
			const isMember = team!.members.find((member, index) => member.user.id == user!.id);
			if (isMember) {
				return res.status(400).json({ message: "Already a member." });
			}

			teamService.sendTeamInvite(team!, req.body.email, options);
			return res.json({
				message: "Invite sent",
			});
		}
	);

	return router;
};
