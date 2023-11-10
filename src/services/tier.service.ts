import { Tier } from "@entities/Tier";
import { User } from "@entities/User";
import { Database, Redis } from "@lib/database";
import { FindOneOptions, FindOptionsWhere, Repository } from "typeorm";
import { PaymentService } from "./payments.service";

export class TierService {
	private readonly tierRepository: Repository<Tier>;
	private readonly paymentService: PaymentService;

	constructor() {
		this.tierRepository = Database.datasource!.getRepository(Tier)!;
		this.paymentService = new PaymentService();
	}

	async getTiers() {
		return await this.tierRepository.find();
	}

	findTier(query: FindOptionsWhere<Tier>) {
		return this.tierRepository.findOne({ where: query });
	}

	async initializeTierUpgrade(user: User, toTier: Tier) {
		const payment = await this.paymentService.initializePayment({
			email: user.email,
			amount: toTier.amount,
			callback_url: `${
				process.env.NODE_ENV == "production" ? "" : "http://localhost:3000/"
			}v1/tier-upgrade-callback/${user.id}`,
		});

		if (payment.status == true) {
			const client = Redis.getClient()!;

			client.hset(
				"pending-tier-upgrades",
				payment.data.reference,
				JSON.stringify({ user: user.id, tierUpgrade: toTier.id })
			);
			return payment.data;
		}

		return { message: payment.message };
	}

	async confirmUpgrade(reference: string, userId: number | string) {
		const client = Redis.getClient()!;
		const cached = await client.hget("pending-tier-upgrades", reference);

		if (!cached) {
			return false;
		}

		const data = JSON.parse(cached);

		if (data.user == userId) {
			return data;
		}

		return false;
	}

	async upgradeTier(data: { user: number | string; tier: number | string }) {}

	async updateTier(tier: Tier, data: any) {
		
	}

	async saveTier(tier: Tier) {
		await this.tierRepository.save(tier);
	}
}
