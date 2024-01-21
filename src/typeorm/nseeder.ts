import casual from "casual";

if (process.env.NODE_ENV == "production") {
	process.exit(1);
}

import { Database } from "@lib/database";
import { AppDataSource } from "./data-source";
import { Log, LogType } from "@entities/Log";

type Frame<T> = Record<keyof T, () => string | number | undefined | null | Array<any>>;

class Generator<T = any> {
	private frame: Frame<T>;

	public iterCount: number | 1 = 1;

	constructor(frame: Frame<T>) {
		this.frame = frame;
	}

	// Builder pattern
	count(n: number) {
		if (n < 1) {
			this.iterCount = 1;
			return this;
		}
		this.iterCount = n;
		return this;
	}

	private generate(): Record<string, string> {
		const obj: Record<string, string> = {};
		for (let i of Object.keys(this.frame)) {
			// @ts-ignore
			obj[i] = this.frame[i]();
		}
		return obj;
	}

	run() {
		const result = [];
		for (let i = 0; i < this.iterCount; i++) {
			result.push(this.generate());
		}

		return result;
	}
}

class Seeder<T> {
	private generator;
	private entity;
	private iterCount: number = 1;

	constructor(frame: Frame<T>, entity: any) {
		this.generator = new Generator(frame);
		this.entity = entity;
	}

	count(n: number) {
		this.generator.count(n);
		return this;
	}

	async run() {
		const data = this.generator.run();
		const db = Database.getDatasource()?.getRepository(this.entity);

		await db?.save(data);
		return 1;
	}
}

export const logSeeder = new Seeder<Log>(
	{
		id: () => undefined,
		text: () => casual.text,
		level: () => casual.random_element(Object.values(LogType)),
		ip: () => casual.ip,
		tags: () => [],
		app: () => 2, //casual.random_element(apps),
		context: () => undefined,
		saved: () => undefined,
		createdAt: () => undefined,
		updatedAt: () => undefined,
	},
	Log
);

// (async () => {
// 	try {
// 		await Database.initialize(AppDataSource);
	
		
// 		console.log(await logSeeder.count(10000).run());
// 		process.exit(0);
// 	} catch (err) {
// 		console.error(err);
// 		process.exit(1);
// 	}
// })();
