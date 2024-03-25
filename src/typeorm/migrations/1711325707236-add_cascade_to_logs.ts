import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeToLogs1711325707236 implements MigrationInterface {
    name = 'AddCascadeToLogs1711325707236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "logs"
        DROP CONSTRAINT logs_app;`);
        await queryRunner.query(`ALTER TABLE "logs"
        ADD CONSTRAINT logs_app
        FOREIGN KEY (apptoken)
        REFERENCES apps(token)
        ON UPDATE CASCADE;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "logs"
        DROP CONSTRAINT logs_app;`);
        await queryRunner.query(`ALTER TABLE "logs"
        ADD CONSTRAINT logs_app
        FOREIGN KEY (apptoken)
        REFERENCES apps(token);`);
    }

}
