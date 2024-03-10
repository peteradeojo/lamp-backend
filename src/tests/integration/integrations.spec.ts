import request from "supertest";
import { Database } from "@lib/database";
import Server from "@lib/server";
import seeder from "../../typeorm/seeder";

let app: any;
let token: string;
beforeAll(async () => {
	await Server.initialize();
	app = Server.getApp();

	await seeder();

	const r = await request(app).post("/v1/auth/register").send({
		email: "adeojopeter@gmail.com",
		password: "12345678",
		password_confirmation: "12345678",
		name: "Bolu",
	});

	token = r.body.data?.token;
});

describe("app management", () => {
	it("can fetch apps", async () => {
		const r = await request(app).get("/v1/apps").set("Authorization", `Bearer ${token}`);

		expect(r.statusCode).toBe(200);
		expect(r.body.data.length).toBe(0);
	});

	it("can create an app", async () => {
		const r = await request(app).post("/v1/apps").set("Authorization", `Bearer ${token}`).send({
			title: "Dey play",
		});

		const created = r.body.data;
		expect(r.statusCode).toBe(200);
		expect(created.app.title).toBe("Dey play");
		expect(typeof created.app.token).toBe('string');
	});
});

afterAll(async () => {
	await Database.datasource?.query("PRAGMA foreign_keys = OFF");
	await Database.datasource?.query("DELETE FROM accounts");
	await Database.datasource?.query("DELETE FROM users");
	await Database.datasource?.query("PRAGMA foreign_keys = ON");
	await Server.destroy();
});
