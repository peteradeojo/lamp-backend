import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class TimeStamped {
	@CreateDateColumn({
		type: 'datetime',
		// precision: 0,
		nullable: true
	})
	createdAt: Date;
	
	@UpdateDateColumn({
		type: 'datetime',
		// precision: 0,
		nullable: true,
	})
	updatedAt: Date;
}
