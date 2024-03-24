import { MigrationInterface, QueryRunner } from "typeorm"

export class AddOriginToSystemLogs1711262949899 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const query = "ALTER TABLE system_logs ADD origin text not null DEFAULT 'gateway'";
        await queryRunner.query(query);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE system_logs DROP origin");
    }
}
