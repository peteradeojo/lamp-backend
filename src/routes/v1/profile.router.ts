import { User } from "@entities/User";
import { Redis } from "@lib/database";
import { AppService } from "@services/apps.service";
import { PaymentService } from "@services/payments.service";
import { TierService } from "@services/tier.service";
import { UserService } from "@services/user.service";
import { Router } from "express";
import Joi from "joi";

const router = Router();

const appService = new AppService();
const userService = new UserService();
const paymentService = new PaymentService();

export default function profileRouter() {
	const tierService = new TierService();
	router.get("/", async (req, res) => {
		const apps = await appService.getUserApps((req.user as any).id);

		return res.json({ user: req.user, apps });
	});

	router.post(
		"/initialize-upgrade",
		(req, res, next) => {
			const schema = Joi.object({
				tier: Joi.number().required(),
			});

			const { error } = schema.validate(req.body);

			if (error) {
				return res.status(400).json(error.details);
			}

			return next();
		},
		async (req, res) => {
			try {
				const tier = await tierService.findTier({ id: req.body.tier });
				const user: User = req.user as any;

				if (!tier) {
					return res.status(400).json({ message: "Invalid Tier ID" });
				}

				if (user.account.tier.id == tier.id) {
					res.statusMessage = "Crack?";
					return res.status(420).json({ message: "Crack?" });
				}

				const payment = await tierService.initializeTierUpgrade(user, tier);
				return res.json(payment);
			} catch (error: any) {
				console.error(error);
				return res
					.status(500)
					.json({ message: "An error occurred. Pleasse try again later.", error: error.message });
			}
		}
	);

	return router;
}
