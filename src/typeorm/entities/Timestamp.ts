import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class TimeStamped {
	@CreateDateColumn({
		type: 'datetime',
		precision: null
	})
	createdAt: Date;
	
	@UpdateDateColumn({
		type: 'datetime',
		precision: null
	})
	updatedAt: Date;
}
