import { Database } from "@lib/database"
import { AppDataSource } from "typeorm/data-source";

export default async () => {
  await Database.initialize(AppDataSource);
  await Database.datasource!.query("DELETE FROM accounts");
  await Database.datasource!.query("DELETE FROM users");
}