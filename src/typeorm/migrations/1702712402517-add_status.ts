import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatus1702712402517 implements MigrationInterface {
    name = 'AddStatus1702712402517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_member\` ADD \`status\` smallint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_member\` DROP COLUMN \`status\``);
    }

}
