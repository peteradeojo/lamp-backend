import axios from "axios";

export class PaymentService {
	private readonly privateKey: string;
	private readonly publicKey: string;
	private readonly baseUrl: string;

	constructor() {
		this.privateKey = process.env.PAYSTACK_SK!;
		this.publicKey = process.env.PAYSTACK_PK!;
		this.baseUrl = process.env.PAYSTACK_URL!;
	}

	async initializePayment(data: { amount: number; email: string; [key: string]: any }) {
		data.key = this.publicKey;
		data.channels = ["card", "bank_transfer", "qr"];
		data.amount = data.amount * 100;

		console.log(data);

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
		const request = await axios.get(`${this.baseUrl}/plan`, {
			headers: {
				Authorization: `Bearer ${this.privateKey}`,
			}
		});

		return request.data;
	}

	async createPlans(data: any) {
		const request = await axios.post(`${this.baseUrl}/plan`, data, {
			headers: {
				Authorization: `Bearer ${this.privateKey}`,
			}
		});
	}
}
