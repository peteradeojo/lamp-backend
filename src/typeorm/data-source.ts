import "reflect-metadata";
import { DataSource } from "typeorm";

if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

import config from './ormconfig';

export const AppDataSource = new DataSource(config);
