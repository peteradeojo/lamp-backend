import path from "path";

if (process.env.NODE_ENV !== "production") {
	require("dotenv").config({
		path: path.resolve(__dirname, "../.env"),
	});
}

// import Server from "./lib/server";
import Server from "@lib/ioserver";

(async () => {
	await Server.initialize();
	await Server.start();
})();
