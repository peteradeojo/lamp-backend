import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class TimeStamped {
	@CreateDateColumn({
		name: 'createdat'
	})
	createdAt: Date;

	@UpdateDateColumn({
		name: 'updatedat'
	})
	updatedAt: Date;
}
