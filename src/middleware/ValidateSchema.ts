import { RequestHandler } from "express";
import { Schema } from "joi";

export const validateSchema = (schema: Schema): RequestHandler => {
	return (req, res, next) => {
		const { error } = schema.validate(req.body);
		if (error) {
			return res.status(400).json({
				message: error.message,
			});
		}

		return next();
	};
};

export const validateQuerySchema = (schema: Schema): RequestHandler => {
	return (req, res, next) => {
		const { error } = schema.validate(req.query);
		if (error) {
			return res.status(400).json({
				message: error.message,
			});
		}

		return next();
	};
};

export const validateParamsSchema = (schema: Schema): RequestHandler => {
	return (req, res, next) => {
		const { error } = schema.validate(req.params);
		if (error) {
			return res.status(400).json({
				message: error.message,
			});
		}

		return next();
	};
};
