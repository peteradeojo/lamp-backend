import { Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export class TimeStamped {
	@CreateDateColumn({ precision: null })
	createdAt: Date;

	@UpdateDateColumn({ precision: null })
	updatedAt: Date;
}
