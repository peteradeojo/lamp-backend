import { User } from "./entities/User";
import { App } from "./entities/App";
import { Log } from "./entities/Log";
import { Metrics } from "./entities/Metrics";
import { Account } from "./entities/Account";
import { Tier } from "./entities/Tier";
import { PaymentPlan } from "./entities/PaymentPlan";
import Team from "./entities/Team";
import TeamMember from "./entities/TeamMember";
import AppTeam from "./entities/AppTeam";
import path from "path";

export default {
	type: (process.env.DATABASE_TYPE as any) || "mysql",
	ssl: process.env.APP_ENV == "production" ? {} : undefined,
	url: process.env.DATABASE_URL,
	database: process.env.DATABASE_PATH,
	synchronize: process.env.APP_ENV == "production" ? false : true,
	logging: false,
	entities: [User, App, Log, Metrics, Account, Tier, PaymentPlan, Team, TeamMember, AppTeam],
	cache: true,
	migrations: [path.join(__dirname, "migrations/*.ts")],
	subscribers: [],
};
