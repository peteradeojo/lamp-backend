import { PaymentPlan } from "@entities/PaymentPlan";
import { Tier } from "@entities/Tier";
import { Database, Redis } from "@lib/database";
import axios from "axios";
import { Repository } from "typeorm";

export class PaymentService {
	private readonly privateKey: string;
	private readonly publicKey: string;
	private readonly baseUrl: string;
	private readonly tierRepository: Repository<Tier>;
	private readonly planRepository: Repository<PaymentPlan>;

	constructor() {
		this.privateKey = process.env.PAYSTACK_SK!;
		this.publicKey = process.env.PAYSTACK_PK!;
		this.baseUrl = process.env.PAYSTACK_URL!;

		this.tierRepository = Database.getDatasource()!.getRepository(Tier);
		this.planRepository = Database.getDatasource()!.getRepository(PaymentPlan);
	}

	async initializePayment(data: { amount: number; email: string; [key: string]: any }) {
		data.key = this.publicKey;
		data.channels = ["card", "bank_transfer", "qr"];
		data.amount = data.amount * 100;

		const request = await axios.post(`${this.baseUrl}/transaction/initialize`, data, {
			headers: {
				Authorization: `Bearer ${this.privateKey}`,
			},
		});
		return request.data;
	}

	async verifyPayment(reference: string) {
		const request = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
			headers: {
				Authorization: `Bearer ${this.privateKey}`,
			},
		});

		const {
			data: { status, message, data },
		} = request;

		if (!status) {
			return { status, message };
		}

		if (data.status != "success") {
			return { status: false, message: data.message || message };
		}

		return { status: true, amount: data.amount / 100 };
	}

	async plans() {
		const data = await Redis.client?.get("paystack_payment_plans");
		if (data) {
			return JSON.parse(data);
		}

		const request = await axios.get(`${this.baseUrl}/plan`, {
			headers: {
				Authorization: `Bearer ${this.privateKey}`,
			},
		});

		if (request.data.status == true) {
			await Redis.client?.setex(
				"paystack_payment_plans",
				300,
				JSON.stringify({
					data: request.data.data.filter((d: { is_deleted: boolean }) => d.is_deleted == false),
					meta: request.data.meta,
				})
			);

			return request.data;
		}

		return [];
	}

	async createPlans(data: any) {
		data.send_invoices = true;
		data.send_sms = false;
		data.amount *= 100;

		console.log(data);
		const request = await axios.post(`${this.baseUrl}/plan`, data, {
			headers: {
				Authorization: `Bearer ${this.privateKey}`,
			},
		});

		const result = request.data;

		if (result.status == true) {
			const plan = this.planRepository.create({
				name: result.data.name,
				amount: result.data.amount,
				planId: result.data.id,
				planCode: result.data.plan_code,
				provider_data: JSON.stringify(result.data),
			});

			return plan;
		}

		return false;
	}
}
