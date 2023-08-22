import { JwtPayload } from "jsonwebtoken";
import { DoneCallback, PassportStatic } from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { UserService } from "../services/user.service";

const userService = new UserService();

const debug = require("debug")("app:passport");

const passportConfig = (passport: PassportStatic) => {
	passport.use(
		new JwtStrategy(
			{
				secretOrKey: process.env.JWT_SECRET || "secret",
				jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			},
			async (payload: JwtPayload, done: DoneCallback) => {
				const { id } = payload;
				if (!id) return done(null, false);
				try {
					const user = await userService.getUserById(id);
					if (user) {
						// user.password = undefined;
						return done(null, user);
					}

					return done(null, false);
				} catch (err) {
					debug(err);
					return done(err, false);
				}
			}
		)
	);

	passport.use(
		"admin",
		new JwtStrategy(
			{
				secretOrKey: process.env.JWT_SECRET!,
				jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			},
			async (payload: JwtPayload, done: DoneCallback) => {
				const { id } = payload;
				if (!id) return done(null, false);
				try {
					const user = await userService.getUserById(id);
					if (user && user.isAdmin) {
						// user.password = undefined;
						return done(null, user);
					}

					return done(null, false);
				} catch (err) {
					debug(err);
					return done(err, false);
				}
			}
		)
	);
};

export default passportConfig;
