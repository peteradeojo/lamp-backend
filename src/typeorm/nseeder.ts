import { Database } from "@lib/database";
import { AppDataSource } from "./data-source";
import { Log } from "@entities/Log";
import { App } from "@entities/App";
import { faker, Faker } from "@faker-js/faker";

abstract class Seeder {
	constructor() {}
	abstract run(records?: number): Promise<any>;
}

class LogSeeder extends Seeder {
	async run(records = 10) {
		const apps = await Database.datasource?.query(`SELECT * FROM apps LIMIT 1`);
		if (!apps || apps?.length < 1) {
			return;
		}
		const logRepository = Database.datasource?.getRepository(Log);

		let query = "";

		for (let i = 0; i < records; i++) {
			query += `INSERT INTO logs (apptoken, text, level) VALUES ('${
				apps[0].token
			}', '${faker.word.words({ count: 20 })}', 'error');`;
		}

		await logRepository?.query(query);
	}
}

(async () => {
	await Database.initialize(AppDataSource);

	// const dataSrc = Database.datasource!;
	const seeders: Seeder[] = [new LogSeeder()];
	const runners = await Promise.all(seeders.map((v) => v.run()));

	console.log(runners);

	await Database.destroy();
	console.log("Done");
})();
