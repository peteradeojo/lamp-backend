import { Router } from "express";
import passport from "passport";

import authRouter from "./auth.router";
import appsRouter from "./apps.router";
import logsRouter from "./logs.router";
import adminRouter from "./admin.router";
import profileRouter from "./profile.router";
import metricsRouter from "./metrics.router";
import { PaymentService } from "@services/payments.service";
import { TierService } from "@services/tier.service";
import teamsRouter from "./teams.router";
import RateLimiter from "@middleware/RateLimiter";

const router = Router();

export const v1Router = () => {
	router.use("/auth", authRouter());
	router.use("/apps", passport.authenticate("jwt", { session: false }), appsRouter());
	router.use("/logs", logsRouter());
	router.use("/admin", adminRouter());
	router.use("/profile", passport.authenticate("jwt", { session: false }), profileRouter());
	router.use("/metrics", RateLimiter(10), passport.authenticate("jwt", { session: false }), metricsRouter());
	router.use("/teams", RateLimiter(10), passport.authenticate("jwt", { session: false }), teamsRouter());

	router.get("/tier-upgrade-callback/:id", async (req, res) => {
		const paymentService = new PaymentService();
		const tierService = new TierService();

		const { trxref, reference } = req.query;
		const { id: userId } = req.params;

		const verification = await paymentService.verifyPayment((trxref || reference) as string);

		if (verification.status !== true) {
			return res.status(400).json(verification);
		}

		const confirmUpgrade = await tierService.confirmUpgrade(reference as string, userId);
		if (!confirmUpgrade) {
			return res.status(400).json({ message: "Data mismatch." });
		}

		const upgrade = tierService.upgradeTier({
			user: confirmUpgrade.user,
			tier: confirmUpgrade.tierUpgrade,
		});

		return res.json({ message: "Hello" });
	});

	return router;
};
