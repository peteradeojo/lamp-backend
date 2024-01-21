import { Database } from "@lib/database";
import { AppDataSource } from "./data-source";
import { DataSource, Repository } from "typeorm";

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
	const manager = Database.datasource!.manager;

	const check = await manager.query("SELECT COUNT(*) as num FROM tiers");
	if (check[0]['num'] > 0) {
		return;
	}

	for (let tier of tiers) {
		let query = `INSERT INTO tiers (name, description, limits, amount) VALUES (?, ?, ?, ?)`;

		if (process.env.DATABASE_TYPE !== "sqlite") {
			query += ` ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), limits = VALUES(limits), amount = VALUES(amount)`;
		}

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

export default async () => {
	try {
		await Database.initialize(AppDataSource);

		await Promise.all(seeders.map((s) => s(Database.datasource!)));
		// await Database.destroy();

		return "Done";
	} catch (err) {
		console.error(err);
		return err;
	}
};
