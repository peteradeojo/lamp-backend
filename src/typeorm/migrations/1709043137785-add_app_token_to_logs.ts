import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppTokenToLogs1709043137785 implements MigrationInterface {
    name = 'AddAppTokenToLogs1709043137785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`logs\` DROP FOREIGN KEY \`FK_1064a718797ca53d425166ea02a\``);
        await queryRunner.query(`ALTER TABLE \`logs\` CHANGE \`appId\` \`appToken\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`apps\` CHANGE \`token\` \`token\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`apps\` ADD UNIQUE INDEX \`IDX_7d1818ae4cf21482433b999123\` (\`token\`)`);
        await queryRunner.query(`ALTER TABLE \`logs\` DROP COLUMN \`appToken\``);
        await queryRunner.query(`ALTER TABLE \`logs\` ADD \`appToken\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`logs\` ADD CONSTRAINT \`logs_app\` FOREIGN KEY (\`appToken\`) REFERENCES \`apps\`(\`token\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`logs\` DROP FOREIGN KEY \`logs_app\``);
        await queryRunner.query(`ALTER TABLE \`logs\` DROP COLUMN \`appToken\``);
        await queryRunner.query(`ALTER TABLE \`logs\` ADD \`appToken\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`apps\` DROP INDEX \`IDX_7d1818ae4cf21482433b999123\``);
        await queryRunner.query(`ALTER TABLE \`apps\` CHANGE \`token\` \`token\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`logs\` CHANGE \`appToken\` \`appId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`logs\` ADD CONSTRAINT \`FK_1064a718797ca53d425166ea02a\` FOREIGN KEY (\`appId\`) REFERENCES \`apps\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
