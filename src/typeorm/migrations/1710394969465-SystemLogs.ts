import { MigrationInterface, QueryRunner } from "typeorm"

export class SystemLogs1710394969465 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sql = `
        CREATE TABLE "system_logs" ("createdat" TIMESTAMP NOT NULL DEFAULT now(), "updatedat" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying NOT NULL, "stack" character varying, PRIMARY KEY ("id"))
        `;

        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("system_logs");
    }

}
