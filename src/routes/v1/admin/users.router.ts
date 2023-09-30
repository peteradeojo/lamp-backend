import { Router } from "express";

import { UserService } from "@services/user.service";
import { Database } from "@lib/database";
import { AppService } from "@services/apps.service";

const router = Router();
const userService = new UserService();
const appService = new AppService();

export default function () {
	router.get("/:id", async (req, res) => {
		try {
			const queryRunner = Database.datasource!.createQueryRunner();
			const { id } = req.params;

			const user = await userService.getUserById(id);
			if (!user) {
				return res.status(404).json({
					message: "User not found",
				});
			}

      const apps = await appService.getUserApps(parseInt(id));

			return res.json({...user, apps});
		} catch (err: any) {
			return res.status(500).json({
				message: err.message,
			});
		}
	});
	return router;
}
