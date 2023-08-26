import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { App } from "./entities/App";
import { Log } from "./entities/Log";
import { Metrics } from "@entities/Metrics";

export const AppDataSource = new DataSource({
	type: "mysql",
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT!),
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DATABASE,
	synchronize: true,
	logging: false,
	entities: [User, App, Log, Metrics],
	cache: true,
	migrations: [],
	subscribers: [],
	// dropSchema: true,
});

export const MetricDataSource = new DataSource({
	type: "mysql",
	host: process.env.METRIC_DB_HOST,
	port: parseInt(process.env.METRIC_DB_PORT!),
	username: process.env.METRIC_DB_USER,
	password: process.env.METRIC_DB_PASSWORD,
	database: process.env.METRIC_DATABASE,
	entities: [Metrics, User, App],
	synchronize: true,
	logging: false,
	cache: true,
});