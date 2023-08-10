import express, {
	ErrorRequestHandler,
	Express,
	NextFunction,
	Request,
	Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import { DataSource } from "typeorm";
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

	private static datasources: DataSource[] = [AppDataSource];

	private static async bootstrap() {
		try {
			await Database.initialize(AppDataSource);
			await Cache.initialize();
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

		this.registerRoutes(app);

		app.use((req, res) => {
			return res.status(404).json({
				status: 404,
				message: "Not found",
			});
		});

		this.app = app;
		this.port = parseInt(process.env.PORT!) || 3000;
	}

	public static async start() {
		// await this.bootstrap();
		this.app.listen(
			this.port,
			debug(`Server is listening on port ${this.port}`)
		);
	}

	private static registerRoutes(app: Express): void {
		app.use("/v1", v1Router());
	}
}
