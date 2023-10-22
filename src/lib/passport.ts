import { JwtPayload } from "jsonwebtoken";
import { DoneCallback, PassportStatic } from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as GithubStrategy, Profile } from "passport-github2";
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
					const user = await userService.getUserSession(id);
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

	passport.use(
		new GithubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID!,
				clientSecret: process.env.GITHUB_CLIENT_SECRET!,
				callbackURL:
					process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/auth/github/callback",
			},
			async (accessToken: string, refreshToken: string, profile: Profile, done: DoneCallback) => {
				try {
					let user = await userService.getUser({ where: { githubId: profile.id } });

					if (!user) {
						user = (await userService.newUser({
							name: profile.displayName,
							email: profile.emails![0].value,
							githubId: profile.id,
						})) as any;
					}

					return done(null, user);
				} catch (err) {
					debug(err);
					return done(err, false);
				}
			}
		)
	);
};

export default passportConfig;
