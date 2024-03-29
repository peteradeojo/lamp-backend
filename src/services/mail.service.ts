import nodemailer, { Transporter } from "nodemailer";

export default class Mailer {
	private static transport: Transporter;

	private static initialize() {
		if (!this.transport) {
			const config = {
				host: process.env.SMTP_HOST || "localhost",
				port: Number(process.env.SMTP_PORT || "587"),
				secure: false,
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
				tls: {
					ciphers: "SSLv3",
				},
			};
			this.transport = nodemailer.createTransport(config);
		}
	}

	static async send(to: string, message: string | Buffer, subject: string = "Mail") {
		try {
			this.initialize();
			const info = await this.transport.sendMail({
				to,
				from: `${process.env.SMTP_USER}`,
				subject,
				html: message,
			});

			return info;
		} catch (err) {
			console.error(err);
			return;
		}
	}
}
