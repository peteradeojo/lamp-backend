import "reflect-metadata";
import { DataSource } from "typeorm";

import config from './ormconfig';

export const AppDataSource = new DataSource(config);
