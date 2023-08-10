import request from "supertest";
import Server from "../lib/server";
import { Database } from "../lib/database";

describe("Server initialization", () => {
	test("initialiaing datasource", (done) => {
		Server.bootstrap()
			.then(() => {
				expect(Database.datasource).toBeDefined();
			})
			.catch((err) => {
				console.error(err);
			});
		// .finally(done());
	}, 10000);
});
