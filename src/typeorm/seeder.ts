require("dotenv").config();

const debug = (str: any) => {
	console.log(str);
};

import { Database } from "@lib/database";
import { AppDataSource } from "./data-source";
import { DataSource, Repository } from "typeorm";
import { Tier } from "@entities/Tier";

const tiers = [
	{
		name: "Free",
		description: "Free plan",
		limits: JSON.stringify([
			{ code: "L1000", description: "<1000 logs stored", scope: "logs", max: 1000 },
			{ code: "AI5", description: "Only 5 logs critical analysis", scope: "assistant", max: 5 },
		]),
		amount: 0,
	},
	{
		name: "Developer",
		description: "For the developer",
		limits: JSON.stringify([
			{ code: "L1000", description: "<10000 logs stored", scope: "logs", max: 1000 },
			{ code: "AI5", description: "Only 5 logs critical analysis", scope: "assistant", max: 5 },
		]),
		amount: 1000,
	},
];

const tierSeeder = async (datasource: DataSource) => {
	const tierRepository: Repository<Tier> = datasource.getRepository(Tier);

	// const tierData = tierRepository.create(tiers as any)
	// await tierRepository.upsert(tierData, {
	// 	conflictPaths: {
	// 		name: true,
	// 		id: true,
	// 	},
	// 	skipUpdateIfNoValuesChanged: true,
	// 	upsertType: "on-duplicate-key-update"
	// });
	const manager = Database.datasource!.manager;

	for (let tier of tiers) {
		let query = `INSERT INTO tiers (name, description, limits, amount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), limits = VALUES(limits), amount = VALUES(amount)`;

		await manager.query(query, [
			tier.name,
			tier.description,
			JSON.stringify(tier.limits),
			tier.amount,
		]);
	}

	return;
};

const seeders = [tierSeeder];

async function main() {
	try {
		await Database.initialize(AppDataSource);

		await Promise.all(seeders.map((s) => s(Database.datasource!)));
		// await Database.destroy();

		debug("DB Seeding completed.");

		return "Done";
	} catch (err) {
		console.error(err);
		return err;
	} finally {
		process.exit(0);
	}
}

main().then((r) => debug(r));
