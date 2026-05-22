import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

class MigrationsStatusQueryDto {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    all?: boolean;
}

type PrismaMigrationRow = {
    id: string;
    migration_name: string;
    started_at: Date;
    finished_at: Date | null;
    rolled_back_at: Date | null;
    applied_steps_count: number;
    logs: string | null;
};

type PgsqlMigrationRow = {
    file_name: string;
    hash: string;
    updated_at: Date;
};

type PgsqlHistoryRow = {
    id: number;
    file_name: string;
    hash: string;
    failed: boolean;
    error: string | null;
    created_at: Date;
};

@ApiTags('SysAdmin - Operações de Reprocessamento e Sincronização')
@ApiBearerAuth('access-token')
@Controller()
export class SysadminMigrationsController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('migrations/status')
    @Roles(['SMAE.sysadmin'], 'Verifica status das migrations Prisma e PSQL (manual-copy)')
    async migrationsStatus(@Query() query: MigrationsStatusQueryDto) {
        const showAll = query.all === true;

        const prismaMigrations = showAll
            ? await this.prisma.$queryRaw<PrismaMigrationRow[]>`
                SELECT id, migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs
                FROM _prisma_migrations
                ORDER BY started_at DESC
            `
            : await this.prisma.$queryRaw<PrismaMigrationRow[]>`
                SELECT id, migration_name, started_at, finished_at, rolled_back_at, applied_steps_count, logs
                FROM _prisma_migrations
                WHERE applied_steps_count = 0
                ORDER BY started_at DESC
            `;

        const pgsqlMigrations = await this.prisma.$queryRaw<PgsqlMigrationRow[]>`
            SELECT file_name, hash, updated_at
            FROM _migrate_pgsql
            ORDER BY file_name ASC
        `;

        const erroredFiles = pgsqlMigrations.filter((m) => m.hash === '[Errored]').map((m) => m.file_name);

        const pgsqlLastFailures = await this.prisma.$queryRaw<PgsqlHistoryRow[]>`
            SELECT h.id, h.file_name, h.hash, h.failed, h.error, h.created_at
            FROM _migrate_pgsql_history h
            WHERE h.failed = TRUE
              AND h.file_name IN (
                  SELECT file_name FROM _migrate_pgsql WHERE hash = '[Errored]'
              )
            ORDER BY h.created_at DESC
            LIMIT 20
        `;

        return {
            prisma: {
                filter: showAll ? 'all' : 'applied_steps_count=0',
                count: prismaMigrations.length,
                rows: prismaMigrations,
            },
            pgsql: {
                count: pgsqlMigrations.length,
                errored: erroredFiles,
                rows: pgsqlMigrations,
                last_failures: pgsqlLastFailures,
            },
        };
    }
}
