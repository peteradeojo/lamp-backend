import express, {
	Express,
	NextFunction,
	Request,
	Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";

const debug = require("debug")("app:server");

import { AppDataSource } from "../typeorm/data-source";
import { corsOptions } from "../config";
import { Cache, Database } from "./database";
import { v1Router } from "../routes/v1";
import passportConfig from "./passport";

export default class Server {
	private static app: Express;
	private static port: number;

	private static async bootstrap() {
		try {
			Cache.initialize();
			await Database.initialize(AppDataSource);
		} catch (err) {
			debug(err);
		}
	}

	public static async initialize() {
		await Server.bootstrap();

		const app = express();

		if (app.get("env") === "development") {
			app.use(require("morgan")("dev"));
		}

		app.use(cors(corsOptions));
		app.use(helmet());
		app.use(express.json());
		app.use(express.urlencoded({ extended: true }));

		passportConfig(passport);
		app.use(passport.initialize());

		app.use((err: any, req: Request, res: Response, next: NextFunction) => {
			if (err) {
				debug(err);
				return res.status(500).json({
					message: err.message,
				});
			}
			return next();
		});

		Server.registerRoutes(app);

		app.use((req, res) => {
			return res.status(404).json({
				status: 404,
				message: "Not found",
			});
		});

		Server.app = app;
		Server.port = parseInt(process.env.PORT!) || 3000;
	}

	public static async start() {
		// await this.bootstrap();
		Server.app.listen(
			Server.port,
			debug(`Server is listening on port ${Server.port}`)
		);
	}

	private static registerRoutes(app: Express): void {
		app.use("/v1", v1Router());
	}
}
