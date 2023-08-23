import Server from "./server";
import { Server as HTTPServer, createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { IoManager } from "./iomanager";
import { corsOptions } from "@config/index";

const debug = require("debug")("app:ioserver");

export default class IoServer extends Server {
	protected static server: HTTPServer;
	protected static io: SocketIOServer;

	public static getIO = () => IoServer.io;

	protected static initializeSocket() {
		IoServer.io = new SocketIOServer(IoServer.server, {
			cors: corsOptions,
		});
		IoManager.initialize(IoServer.io);
		debug("Socket initialized");
	}

	protected static createServer() {
		IoServer.server = createServer(IoServer.app);
	}

	public static async start(): Promise<void> {
		this.createServer();
		this.initializeSocket();

		IoServer.server.listen(IoServer.port, () => {
			debug(`Server is listening on port ${IoServer.port}`);
		});
	}
}
