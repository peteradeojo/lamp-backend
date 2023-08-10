import { Router } from "express";
import authRouter from "./auth.router";

const router = Router();

export const v1Router = () => {
  router.use('/auth', authRouter());

  return router;
};
