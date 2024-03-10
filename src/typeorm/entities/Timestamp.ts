import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class TimeStamped {
	@CreateDateColumn({})
	createdAt: Date;

	@UpdateDateColumn({})
	updatedAt: Date;
}
