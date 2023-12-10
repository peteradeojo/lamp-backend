import Team from "@entities/Team";
import { validateSchema } from "@middleware/ValidateSchema";
import { UserService } from "@services/user.service";
import { Router } from "express";
import Joi from "joi";

const router = Router();

export default () => {
	const userService = new UserService();

	router.get("/", async (req, res) => {
    if ('mine' in  req.query) {
      const data = await userService.getMyTeams(req.user!);
      return res.json(data);
    } else {
      const data = await userService.getParticipatingTeams(req.user!);
      return res.json(data);
    }
	});

	router.post(
		"/",
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

	return router;
};
