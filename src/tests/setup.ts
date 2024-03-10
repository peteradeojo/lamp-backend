const path = require("path");

export default async () => {
	require("dotenv").config({
		path: path.resolve(process.cwd(), ".env.test"),
	});
};
