import { RedisStore } from "rate-limit-redis";
import { rateLimit } from "express-rate-limit";
import RedisClient from "ioredis";
import { defaultRedisConfig } from "@config/index";
import { number } from "joi";

const client = new RedisClient(defaultRedisConfig);
export default (limit: number = 60, windowMs: number = 60) => {
	return rateLimit({
		windowMs: windowMs * 2000,
		limit,
		legacyHeaders: false,
		standardHeaders: true,
		store: new RedisStore({
      // @ts-expect-error
			sendCommand: async (...args: any[]) => client!.call(...args),
			prefix: "ratelimit:",
		}),
    handler: (req, res, next, options) => {
      return res.status(429).json({message: "Too many requests."});
    }
	});
};
