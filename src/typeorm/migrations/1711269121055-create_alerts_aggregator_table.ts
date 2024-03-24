import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateAlertsAggregatorTable1711269121055 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS alerts_aggregator (
            id uuid not null,
            apptoken text not null,
            level loglevel not null,
            hashed text not null,
            raw text not null,
            createdat timestamp not null,
            updatedat timestamp not null,
            occurences smallint default 1,
            primary key (id),
            unique (apptoken, hashed)
          );`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE alerts_aggregator");
    }

}
