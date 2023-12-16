import "reflect-metadata";
import { DataSource } from "typeorm";

if (process.env.APP_ENV != "production") {
	require("dotenv").config();
}
import config from './ormconfig';

export const AppDataSource = new DataSource(config);

// export const MetricDataSource = new DataSource({
// 	type: "mysql",
// 	host: process.env.METRIC_DB_HOST,
// 	port: parseInt(process.env.METRIC_DB_PORT!),
// 	username: process.env.METRIC_DB_USER,
// 	password: process.env.METRIC_DB_PASSWORD,
// 	database: process.env.METRIC_DATABASE,
// 	// url: process.env.DATABASE_URL,
// 	entities: [Metrics, User, App, Account, Tier],
// 	// synchronize: true,
// 	logging: false,
// 	cache: true,
// });
