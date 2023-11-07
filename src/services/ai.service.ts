import { Log } from "@entities/Log";
import OpenAI from "openai";

type PromptOptions = { includeStack: boolean; limit?: number };

export default class AiService {
	private openai: OpenAI;

	constructor() {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	private async sendPrompt(messages: any[]) {
		const params: OpenAI.Chat.ChatCompletionCreateParams = {
			messages: messages,
			stream: false,
			model: "gpt-3.5-turbo",
		};

		const completion = await this.openai.chat.completions.create(params);
		return completion;
	}

	public async sendChat(logs: Log[], options?: PromptOptions) {
		const prompt = this.constructPrompt(logs, options);
		if (prompt.length < 1) return "";
		const message = await this.sendPrompt(prompt);
		return message;
	}

	private constructPrompt(
		logs: Log[],
		options: PromptOptions = { includeStack: false, limit: 100 }
	) {
		const prompt = [
			{
				role: "user",
				content:
					"You're a highly sophisticated debugger. Examine the following log messages, attempt to identify the programming language used, problems or errors being reported and provide a well-detailed solution.",
			},
		];

		logs.forEach((log) => prompt.push(this.extractPromptFromLog(log, options)));
		return prompt;
	}

	private extractPromptFromLog(log: Log, options: PromptOptions) {
		let content = log.text;

		if (options.includeStack) {
			content += `\n\n${log.context?.substring(0, 100)}`;
		}

		return { role: "user", content };
	}
}
