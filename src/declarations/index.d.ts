import { User } from "../typeorm/entities/User";

declare module "express-serve-static-core" {
	interface Request {
		user?: Express.User & User;
	}
}
