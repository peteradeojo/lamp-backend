import { CorsOptions } from "cors";
import { RedisOptions } from "ioredis";

export const corsOptions: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS!,
};

export const defaultRedisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT! || "6379"),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
}