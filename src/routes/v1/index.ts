import { Router } from "express";
import passport from "passport";

import authRouter from "./auth.router";
import appsRouter from "./apps.router";
import logsRouter from "./logs.router";

const router = Router();

export const v1Router = () => {
  router.use('/auth', authRouter());
  router.use('/apps', passport.authenticate('jwt', { session: false }), appsRouter());
  router.use('/logs', logsRouter());

  return router;
};
