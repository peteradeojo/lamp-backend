import { validateSchema } from "@middleware/ValidateSchema";
import { PaymentService } from "@services/payments.service";
import { TierService } from "@services/tier.service";
import { Router } from "express";
import Joi from "joi";

const router = Router();
export default function () {
	const paymentService = new PaymentService();
	const tierService = new TierService();

	router.get("/plans", async (req, res) => res.json(await paymentService.plans()));
	router.post(
		"/plans",
		validateSchema(
			Joi.object({
				name: Joi.string().required(),
				description: Joi.string(),
				amount: Joi.number().required(),
				interval: Joi.string().valid("monthly").required(),
				tierId: Joi.number().required(),
			}).required()
		),
		async (req, res) => {
			try {
				const tier = await tierService.findTier({ id: req.body.tierId });

				if (!tier) {
					return res.status(400).json({ message: "Tier not found." });
				}

				if (tier.name == "Free") {
					return res.status(400).json({ message: "Can't attach a plan to this tier" });
				}

				const plan = await paymentService.createPlans({ ...req.body, tierId: undefined });

				if (!plan) {
					throw new Error("Plan was not able to be created successfully");
				}

				tier.plan = plan;
				await tierService.saveTier(tier);

				return res.status(201).json({ message: "Plan created successfully", data: tier });
			} catch (error: any) {
				console.error(error);
				return res.status(500).json({ message: error.message });
			}
		}
	);

	return router;
}
