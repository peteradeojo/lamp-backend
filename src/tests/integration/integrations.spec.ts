import request from "supertest";
import { Database } from "@lib/database";
import Server from "@lib/server";

let app: any;
let token: string;
beforeAll(async () => {
	await Server.initialize();
	app = Server.getApp();

	const r = await request(app).post("/v1/auth/register").send({
		email: "adeojopeter@gmail.com",
		password: "12345678",
		password_confirmation: "12345678",
		name: "Bolu",
	});

	token = r.body.data.token;
	console.log(token);
});

describe("app management", () => {
	it("can fetch apps", async () => {
		const r = await request(app).get("/v1/apps").set("Authorization", `Bearer ${token}`);

		expect(r.statusCode).toBe(200);
		expect(r.body.length).toBe(0);
	});

	it("can create an app", async () => {
		const r = await request(app).post("/v1/apps").send({
			title: "Dey play",
		});

		expect(r.statusCode).toBe(200);
		expect(r.body.data.title).toBe("Dey play")
		expect(r.body.data.token).toBe(null);
	});
});

afterAll(async () => {
	// await Database.datasource?.query("DELETE FROM accounts");
	// await Database.datasource?.query("DELETE FROM users");
	await Server.destroy();
});
