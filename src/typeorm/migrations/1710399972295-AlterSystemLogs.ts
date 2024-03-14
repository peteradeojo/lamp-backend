import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterSystemLogs1710399972295 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE loglevel AS ENUM (
            'info',
            'error',
            'warn',
            'debug',
            'critical',
            'fatal');`);
		await queryRunner.query(
			`ALTER TABLE system_logs ADD from_system bit(1), ADD from_user bit(1), ADD context json NULL, ADD level loglevel NOT NULL;`
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.dropColumns("system_logs", ["context", "level", "from_user", "from_system"]);
        await queryRunner.query("DROP TYPE loglevel");
	}
}
