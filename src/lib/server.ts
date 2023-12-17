import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";

const debug = require("debug")("app:server");

import { AppDataSource } from "../typeorm/data-source";
import { corsOptions } from "../config";
import { Cache, Database } from "./database";
// import { v1Router } from "../routes/v1";
import passportConfig from "./passport";

export default class Server {
	protected static readonly app: Express = express();
	protected static port: number;

	public static async bootstrap() {
		try {
			// Cache.initialize();
			await Database.initialize(AppDataSource);
		} catch (err) {
			console.error(err);
			debug(err);
		}
	}

	public static async initialize() {
		await Server.bootstrap();

		if (Server.app.get("env") === "development") {
			Server.app.use(require("morgan")("dev"));
		}

		Server.app.set('trust proxy', true);
		Server.app.use(cors(corsOptions));
		Server.app.use(helmet());
		Server.app.use(express.json());
		Server.app.use(express.urlencoded({ extended: true }));

		passportConfig(passport);
		Server.app.use(passport.initialize());

		Server.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
			if (err) {
				debug(err);
				return res.status(500).json({
					message: err.message,
				});
			}
			return next();
		});

		Server.registerRoutes(Server.app);

		Server.app.use((req, res) => {
			return res.status(404).json({
				status: 404,
				message: "Not found",
			});
		});

		// Server.app = app;
		Server.port = parseInt(process.env.PORT!) || 3000;
	}

	public static getApp = () => Server.app;

	public static async start() {
		// await this.bootstrap();
		Server.app.listen(Server.port, debug(`Server is listening on port ${Server.port}`));
	}

	private static registerRoutes(app: Express): void {
		const { v1Router } = require("../routes/v1");
		app.use("/v1", v1Router());
	}
}
