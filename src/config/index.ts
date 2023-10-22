import { CorsOptions } from "cors";
import { RedisOptions } from "ioredis";

const whiteList = process.env.ALLOWED_ORIGINS!.split(',');
export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }
    
    if (whiteList.includes(origin!) || !origin) {
      callback(null, origin);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

export const defaultRedisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT! || "6379"),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
}