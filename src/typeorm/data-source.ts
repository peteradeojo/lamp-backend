import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { App } from "./entities/App";

export const AppDataSource = new DataSource({
	type: "mysql",
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT!),
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DATABASE,
	synchronize: true,
	logging: false,
	entities: [User, App],
    cache: true,
	migrations: [],
	subscribers: [],
    // dropSchema: true,
});
