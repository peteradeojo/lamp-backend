import { Database, Redis } from "@lib/database";
import Server from "@lib/server";
import { after } from "node:test";
import request from "supertest";
import seeder from "../../typeorm/seeder";

let app: any;
let db: any;
let cache: Redis;
beforeAll(async () => {
	await Server.initialize();
	app = Server.getApp();
	db = Database.datasource!.createQueryRunner();
  cache = new Redis;
	await seeder();
});

describe("Authentication", () => {
	it("should register and have session created", async () => {
		const r = await request(app)
			.post("/v1/auth/register")
			.set("Content-type", "application/json")
			.send({
				email: "adeojopeter@gmail.com",
				name: "Boluwatife",
				password: "12345678",
				password_confirmation: "12345678",
			});

		expect(r.statusCode).toBe(200);
		expect(r.body.data).toHaveProperty("token");

		const data = await cache.get(`user_sessions:${r.body.data.user.id}`);
    expect(data).not.toBeNull();
	}, 5000);

	it("should login and have session created", async () => {
		const r = await request(app).post("/v1/auth/login").send({
			email: "adeojopeter@gmail.com",
			password: "12345678",
		});

		expect(r.statusCode).toBe(200);
		expect(r.body.data).toHaveProperty("token");

    const data = await cache.get(`user_sessions:${r.body.data.user.id}`);
    expect(data).not.toBeNull();
	});
});

afterAll(async () => {
	await db.query("DELETE FROM accounts;");
	await db.query("DELETE FROM users;");
	await Server.destroy();
});
