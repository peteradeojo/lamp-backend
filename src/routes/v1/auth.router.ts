import { Router } from "express";
import Joi from "joi";
import passport from "passport";
import speakeasy from "speakeasy";
import QR from "qrcode";

const debug = require("debug")("app:auth-routes");

import { UserService } from "../../services/user.service";
import { validateSchema } from "../../middleware/ValidateSchema";
import { User } from "../../typeorm/entities/User";

const router = Router();

export default function (): Router {
	const userService = new UserService();

	router.get(
		"/",
		passport.authenticate("jwt", {
			session: false,
		}),
		async (req, res) => {
			return res.json({
				data: { user: req.user },
				message: "",
			});
		}
	);

	router.post(
		"/login",
		validateSchema(
			Joi.object({
				email: Joi.string().email().required(),
				password: Joi.string().required(),
			})
		),
		async (req, res) => {
			const { email, password } = req.body;
			try {
				const token = await userService.authenticate(email, password);

				if (token !== undefined) {
					return res.status(200).json({ message: "", data: token });
				}

				return res.status(401).json({
					message: "Invalid credentials",
				});
			} catch (error: any) {
				return res.status(500).json({
					message: error.message,
				});
			}
		}
	);

	router.post(
		"/register",
		validateSchema(
			Joi.object({
				email: Joi.string().email().required().trim(),
				name: Joi.string().required().trim(),
				password: Joi.string().required(),
				password_confirmation: Joi.any()
					.equal(Joi.ref("password"))
					.required()
					.messages({ "any.only": "{{#label}} must match password" }),
			})
		),
		async (req, res) => {
			const { email, password, name } = req.body;

			try {
				const user = await userService.createUser({ email, password, name });
				const result = await userService.authenticate(user);

				return res.json({ data: result });
			} catch (err: any) {
				return res.status(500).json({
					message: err.message,
				});
			}
		}
	);

	router.get(
		"/2fa/setup",
		passport.authenticate("jwt", { session: false }),
		async (req, res) => {
			const { user } = req;

			const secret = speakeasy.generateSecret({
				name: "LAMP",
				otpauth_url: true,
				length: 32,
				issuer: "LAMP",
			});
			const qrCode = await QR.toDataURL(secret.otpauth_url);

			return res.json({
				secret: secret.base32,
				qrCode,
			});
		}
	);

	router.post(
		"/2fa/enable",
		passport.authenticate("jwt", { session: false }),
		validateSchema(
			Joi.object({
				token: Joi.string().required(),
				secret: Joi.string().required(),
			})
		),
		async (req, res) => {
			const { token, secret } = req.body;

			const verified = speakeasy.totp.verify({
				secret,
				encoding: "base32",
				token,
			});

			if (!verified) {
				return res.status(401).json({
					message: "Invalid token",
				});
			}

			try {
				await userService.enable2Fa((req.user as User).id, secret);

				return res.json({
					message: "2FA enabled",
				});
			} catch (err) {
				debug(err);
				return res.status(500).json({});
			}
		}
	);

	router.post(
		"/2fa/verify",
		validateSchema(
			Joi.object({
				email: Joi.string().email().required(),
				token: Joi.string()
					.pattern(/\d{6}/)
					.message("Invalid token")
					.required(),
			})
		),
		async (req, res) => {
			const { email, token } = req.body;
			const result = await userService.verify2Fa(email, token);

			if (result === false) {
				return res.status(401).json({
					message: "Invalid token",
				});
			}

			return res.json({ data: result, message: "" });
		}
	);

	return router;
}
