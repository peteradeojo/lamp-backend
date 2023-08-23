import { Log } from "@entities/Log";
import { Server, Socket } from "socket.io";
const debug = require("debug")("app:iomanager");

// export class IoManager {
// 	private static io: Server;

// 	// private static logStreamRooms: Set<{ token: string; socketId: string }> = new Set();
// 	private static logStreamRooms: Set<string> = new Set();

// 	public static initialize(io: Server) {
// 		IoManager.io = IoManager.configureIo(io);
// 	}

// 	public static getIO = () => IoManager.io;

// 	public static getRooms = () => IoManager.logStreamRooms;

// 	private static configureIo(io: Server) {
// 		io.on("connection", (socket) => {
// 			socket.on("disconnect", () => {
// 				console.log("Client disconnected");
// 			});

// 			socket.on("connect-log-stream", (token: string) => {
// 				IoManager.logStreamRooms.add(token);
// 				socket.join(token);
// 				debug(`Client joined room ${token}`);
// 			});
// 		});

// 		return io;
// 	}
// }

export class IoManager {
	private static io: Server | undefined;
	private static rooms: { token: string; id: string }[] = [];

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
			throw new Error("IoManager is not initialized. Call initialize() first.");
		}
		return IoManager.io;
	}

	private static configureIo(io: Server) {
		io.on("connection", (socket: Socket) => {
			socket.on("disconnect", () => {
				const room = IoManager.rooms.find((r) => r.id === socket.id);
				if (room) {
					socket.leave(room.token);
					IoManager.rooms = IoManager.rooms.filter((r) => r.id !== socket.id);
					console.log(`Client left room ${room.token}`);
				}

				console.log("Client disconnected");
			});

			socket.on("connect-log-stream", (token: string) => {
				socket.join(token);
				IoManager.rooms.push({ token, id: socket.id });
				console.log(`Client joined room ${token}`);
			});
		});

		return io;
	}

  public static getSocketForRoom(room: string): {token: string, id: string} | undefined {
    return IoManager.rooms.find((r) => r.token === room);
  }
}
