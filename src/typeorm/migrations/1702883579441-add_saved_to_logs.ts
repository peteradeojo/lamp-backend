import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSavedToLogs1702883579441 implements MigrationInterface {
    name = 'AddSavedToLogs1702883579441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`logs\` ADD \`saved\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`logs\` DROP COLUMN \`saved\``);
    }

}
