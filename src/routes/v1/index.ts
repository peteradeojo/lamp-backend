import { Router } from "express";
import passport from "passport";

import authRouter from "./auth.router";
import appsRouter from "./apps.router";
import logsRouter from "./logs.router";
import adminRouter from "./admin.router";
import profileRouter from "./profile.router";

const router = Router();

export const v1Router = () => {
	router.use("/auth", authRouter());
	router.use(
		"/apps",
		passport.authenticate("jwt", { session: false }),
		appsRouter()
	);
	router.use("/logs", logsRouter());
	router.use("/admin", adminRouter());
	router.use(
		"/profile",
		passport.authenticate("jwt", { session: false }),
		profileRouter()
	);

	return router;
};
