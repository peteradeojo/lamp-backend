import { User } from "../typeorm/entities/User";
import { Database } from "../lib/database";
import { Repository } from "typeorm";
import { compareSync, hashSync } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import speakeasy from "speakeasy";

const debug = require("debug")("app:UserService");

export class UserService {
	private userRepository: Repository<User>;

	constructor() {
		// if (!Database.datasource) {
		// 	throw new Error("Database not initialized");
		// }

		this.userRepository = Database.datasource?.getRepository(User)!;
	}

	private async initialize() {
		if (!this.userRepository) {
			this.userRepository = Database.datasource?.getRepository(User)!;
		}
	}

	async getAllUsers(): Promise<User[]> {
		return [];
	}

	private generateUserToken(user: User) {
		return sign({ id: user.id }, process.env.JWT_SECRET!, {
			expiresIn: process.env.JWT_EXPIRES_IN || "1h",
		});
	}

	async authenticate(
		email: string | User,
		password?: string
	): Promise<
		{ token?: string; user?: User; twoFactorEnabled?: boolean } | undefined
	> {
		if (email instanceof User) {
			return {
				token: this.generateUserToken(email),
				user: { ...email, password: undefined },
			};
		}

		if (!password) {
			throw new Error("Password is required");
		}

		const user = await this.userRepository.findOneBy({ email });
		if (user) {
			if (compareSync(password, user.password!)) {
				if (user.twoFactorSecret) {
					return {
						twoFactorEnabled: true,
					};
				}

				return {
					user: { ...user, password: undefined },
					token: this.generateUserToken(user),
				};
			}
		}
		return;
	}

	async createUser(
		data: Pick<User, "email" | "name" | "password">
	): Promise<User> {
		const user = this.userRepository.create(data);

		user.password = hashSync(
			data.password!,
			parseInt(process.env.SALT_ROUNDS! || "10")
		);
		await this.userRepository.save(user);
		return user;
	}

	async getUserById(id: string): Promise<User | null> {
		await this.initialize();
		return this.userRepository.findOne({ where: { id: parseInt(id) } });
	}

	async enable2Fa(id: number, secret: string) {
		try {
			const user = await this.userRepository.findOneBy({ id });
			if (!user) {
				throw new Error("User not found");
			}
			user.twoFactorSecret = sign({ secret }, process.env.JWT_SECRET!);
			debug(user.twoFactorSecret.length);
			await this.userRepository.save(user);
		} catch (err) {
			debug(err);
			throw err;
		}
	}

	async verify2Fa(email: string, token: string) {
		const user = await this.userRepository.findOneBy({ email });
		if (!user) {
			throw new Error("User not found");
		}

		try {
			const payload = verify(user.twoFactorSecret!, process.env.JWT_SECRET!);

			if (typeof payload !== "string") {
				const { secret } = payload;
				const verified = speakeasy.totp.verify({
					secret,
					token,
					encoding: "base32",
				});

				if (verified) {
					return await this.authenticate(user);
				}
			}

			return false;
		} catch (err) {
			debug(err);
			return false;
		}
	}
}
