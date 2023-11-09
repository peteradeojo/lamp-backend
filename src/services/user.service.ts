import { User } from "../typeorm/entities/User";
import { Cache, Database, Redis } from "../lib/database";
import { FindManyOptions, MoreThanOrEqual, QueryRunner, Repository } from "typeorm";
import { compareSync, hashSync } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import speakeasy from "speakeasy";
import { Account } from "@entities/Account";
import { Tier } from "@entities/Tier";

const debug = require("debug")("app:UserService");

type UserType = Omit<User, "twoFactorEnabled"> & {
	twoFactorEnabled?: boolean;
};

export class UserService {
	private userRepository: Repository<UserType>;
	private accountRepository: Repository<Account>;
	private tierRepository: Repository<Tier>;
	private queryRunner: QueryRunner;

	constructor() {
		// if (!Database.datasource) {
		// 	throw new Error("Database not initialized");
		// }

		this.userRepository = Database.datasource?.getRepository(User)!;
		this.accountRepository = Database.datasource?.getRepository(Account)!;
		this.tierRepository = Database.datasource?.getRepository(Tier)!;
	}

	private async initialize() {
		if (!this.userRepository) {
			this.userRepository = Database.datasource?.getRepository(User)!;
		}
		if (this.accountRepository) {
			this.accountRepository = Database.datasource?.getRepository(Account)!;
		}
		if (this.tierRepository) {
			this.tierRepository = Database.datasource?.getRepository(Tier)!;
		}
	}

	async getAllUsers(query: {
		page?: number;
		count?: number;
		recent?: boolean;
	}): Promise<UserType[]> {
		await this.initialize();
		const { page = 1, count = 10, recent = false } = query;

		const params: FindManyOptions = {
			skip: (page - 1) * count, // 0
			take: count, // 10
			order: {
				createdAt: "DESC",
			},
		};

		if (recent === true) {
			params.where = {
				createdAt: MoreThanOrEqual(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)),
			};
		}

		const users = await this.userRepository.find(params);

		return users;
	}

	private generateUserToken(user: User | UserType) {
		return sign({ id: user.id }, process.env.JWT_SECRET!, {
			expiresIn: process.env.JWT_EXPIRES_IN || "1h",
		});
	}

	async updateUserTier(account: Account, tierName: string = "Free") {
		const tier = await this.tierRepository.findOneBy({ name: tierName });
		if (!tier) {
			throw new Error(`Tier ${tierName} not found.`);
		}

		account.tier = tier;
		return await this.accountRepository.save(account, { reload: true });
	}

	async authenticate(
		email: string | UserType,
		password?: string
	): Promise<{ token?: string; user?: UserType; twoFactorEnabled?: boolean } | undefined> {
		await this.initialize();

		if (typeof email === "string") {
			if (!password) {
				throw new Error("Password is required");
			}

			const user = await this.userRepository.findOne({
				where: { email },
				select: ["email", "password", "name", "isAdmin", "twoFactorSecret", "id"],
				relations: {
					account: {
						tier: true,
					},
				},
			});

			if (user) {
				if (user.isAdmin == false) {
					if (!user.account) {
						await this.createAccountForUser(user as any);
					}
	
					if (!user.account.tier) {
						user.account = await this.updateUserTier(user.account);
					}
				}

				if (compareSync(password!, user.password!)) {
					if (user.twoFactorSecret) {
						return {
							twoFactorEnabled: true,
						};
					}

					this.setUserSession(user);

					return {
						user: { ...user, password: undefined },
						token: this.generateUserToken(user),
					};
				}
			}

			return;
		}

		return {
			token: this.generateUserToken(email),
			user: { ...email, password: undefined },
		};
	}

	async createAccountForUser(user: User) {
		const tier = await this.tierRepository.findOneBy({ name: "Free" });
		if (!tier) {
			throw new Error("Free Tier not available.");
		}

		await this.accountRepository.upsert({ user }, ["user"]);
		const query = await this.queryRunner.query(
			`UPDATE accounts set tierId = ${tier.id} WHERE userId = ${user.id}`
		);
	}

	async createUser(data: Pick<User | UserType, "email" | "name" | "password">): Promise<UserType> {
		return Database.datasource!.transaction(async (manager) => {
			const user = this.userRepository.create(data);

			user.password = hashSync(data.password!, parseInt(process.env.SALT_ROUNDS! || "10"));
			const userProfile = await this.userRepository.save(user);

			await this.createAccountForUser(userProfile as any);

			return user;
		});
	}

	async getUserById(id: string): Promise<UserType | null> {
		await this.initialize();
		return this.userRepository.findOne({ where: { id: parseInt(id) } });
	}

	async getUserSession(id: string) {
		const client = Redis.getClient()!;

		const data = await client.get(`user_sessions:${id}`);
		if (data) {
			return JSON.parse(data);
		}
	}

	setUserSession(user: any) {
		const client = Redis.getClient()!;

		// Trying out callbacks to keep operations synchronous - might improve performance
		user.password = undefined;
		return client.set(
			`user_sessions:${user.id}`,
			JSON.stringify(user),
			"EX",
			60 * 60 * 1000,
			(err, result) => {
				if (err) {
					console.error(err);
				}

				return result;
			}
		);
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
		const user = await this.userRepository.findOne({
			where: { email },
			select: ["twoFactorSecret", "email", "id", "name"],
		});
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

	async getNumberOfUsers() {
		await this.initialize();
		return await this.userRepository.count();
	}

	async getUser(query: FindManyOptions<UserType>) {
		return await this.userRepository.findOne(query);
	}

	async newUser(data: any) {
		const user = this.userRepository.create(data);
		await this.userRepository.save(user);
		return user;
	}

	authenticateGithub(user: User) {
		return {
			user,
			token: this.generateUserToken(user!),
		};
	}

	async updateUser(user: any) {
		await this.userRepository.save(user);
		return user;
	}
}
