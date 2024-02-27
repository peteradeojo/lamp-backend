import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeApptokennColumnsNotNullable1709043555370 implements MigrationInterface {
    name = 'MakeApptokennColumnsNotNullable1709043555370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`logs\` DROP FOREIGN KEY \`logs_app\``);
        await queryRunner.query(`ALTER TABLE \`logs\` CHANGE \`appToken\` \`appToken\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`logs\` ADD CONSTRAINT \`logs_app\` FOREIGN KEY (\`appToken\`) REFERENCES \`apps\`(\`token\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`logs\` DROP FOREIGN KEY \`logs_app\``);
        await queryRunner.query(`ALTER TABLE \`logs\` CHANGE \`appToken\` \`appToken\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`logs\` ADD CONSTRAINT \`logs_app\` FOREIGN KEY (\`appToken\`) REFERENCES \`apps\`(\`token\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
