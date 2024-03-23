import { Server, Socket } from "socket.io";
const debug = require("debug")("app:iomanager");

export class IoManager {
	private static io: Server | undefined;
	private static rooms: { token: string; id: string }[] = [];
	private static listeners: { token: string; id: string }[] = [];

	private constructor() {
		// Private constructor to prevent external instantiation
	}

	public static initialize(io: Server) {
		if (!IoManager.io) {
			IoManager.io = IoManager.configureIo(io);
		}
	}

	public static getInstance(): Server {
		if (!IoManager.io) {
			// IoManager.initialize();
			throw new Error("IoManager is not initialized. Call initialize() first.");
		}
		return IoManager.io;
	}

	private static configureIo(io: Server) {
		io.on("connection", (socket: Socket) => {
			socket.on("disconnect", () => {
				console.log("Client disconnected");
			});

			socket.on("connect-log-stream", (token: string) => {
				const l = this.getSocketForRoom(token);
				if (!l) {
					this.listeners.push({ token, id: socket.id });
				}
			});

			socket.on("closing_stream", () => {
				this.listeners = this.listeners.filter((v) => (v.id = socket.id));
			});

			console.log("Socket connected");
		});

		return io;
	}

	public static getSocketForRoom(token: string) {
		return IoManager.listeners.find((r) => r.token === token);
	}

	public static sendTo(message: string, token?: string | number, data?: any) {
		const destination = IoManager.listeners.find((val) => val.token == token);

		if (destination) {
			IoManager.io?.to(destination.id).emit(message, data);
		}
	}
}
