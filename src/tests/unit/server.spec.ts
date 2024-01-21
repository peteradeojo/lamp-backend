import request from "supertest";
import Server from "@lib/ioserver";
import { Cache, Database } from "@lib/database";

beforeAll(async () => {
	await Server.bootstrap();
});

describe("Server initialization", () => {
	it("should initialize a data source correctly", async () => {
		const datasource = Database.getDatasource();
		expect(datasource).toBeDefined();
	}, 3000);

	it("should initialize a cache", async () => {
		const client = Cache.client;
		expect(client).toBeDefined();
	});
});

afterAll(async () => {
	await Server.destroy();
});
