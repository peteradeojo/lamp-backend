import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeDefaultStatus01702712677544 implements MigrationInterface {
    name = 'MakeDefaultStatus01702712677544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_member\` DROP \`status\`, ADD \`status\` smallint NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team_member\` DROP COLUMN \`status\``);
    }

}
