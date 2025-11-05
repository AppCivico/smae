import { BadRequestException, Controller, Get, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { spawn } from 'child_process';
import { Response } from 'express';
import * as path from 'path';
import * as percentile from 'percentile';
import { IsPublic } from './auth/decorators/is-public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
    constructor(private readonly prisma: PrismaService) {}

    @IsPublic()
    @Get('/ping')
    async ping() {
        return 'pong';
    }

    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    @Get('/system/usage')
    async systemUsage() {
        return {
            arquivos: await this.getFileUsage(),
            pessoas: await this.getPessoaUsage(),
        };
    }

    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    @Get('/system/performance-check')
    async performanceCheck() {
        return {
            unloaded: await this.recordPerformance(30),
            loaded: await this.recordPerformance(0),
        };
    }

    async recordPerformance(delayTime: number) {
        const executionTimes: number[] = [];
        const start = Date.now();

        await this.prisma.$transaction(async (prismaTx) => {
            while (Date.now() - start < 10000) {
                const queryStart = Date.now();
                await prismaTx.$queryRaw`SELECT 1`;
                executionTimes.push(Date.now() - queryStart);

                if (delayTime) {
                    await new Promise((resolve) => setTimeout(resolve, delayTime));
                }
            }
        });

        executionTimes.sort((a, b) => a - b);

        const min = executionTimes[0];
        const max = executionTimes[executionTimes.length - 1];
        const p50 = percentile(50, executionTimes);
        const p99 = percentile(99, executionTimes);
        const p999 = percentile(99.9, executionTimes);

        return { min, max, p50, p99, p999, executionTimes: executionTimes.length };
    }

    async getFileUsage(): Promise<any> {
        const fileStats = await this.prisma.arquivo.groupBy({
            by: ['mime_type'],
            _sum: {
                'tamanho_bytes': true,
            },
            _count: {
                _all: true,
            },
        });

        // Ordena por tamanho em ordem decrescente
        fileStats.sort((a, b) => {
            if (b._sum.tamanho_bytes !== null && a._sum.tamanho_bytes !== null)
                return b._sum.tamanho_bytes - a._sum.tamanho_bytes;
            return b._count._all - a._count._all;
        });

        // Converte bytes para megabytes (MB) e cria novo array de objetos
        const perMimeType = fileStats.map((stats) => ({
            mime_type: stats.mime_type,
            count: stats._count._all,
            tamanho_bytes: stats._sum.tamanho_bytes,
            tamanho_mb: stats._sum.tamanho_bytes ? (stats._sum.tamanho_bytes / (1024 * 1024)).toFixed(2) : null,
        }));

        // Calcula contagem total e tamanho total
        const totalCount = fileStats.reduce((acc, stats) => acc + stats._count._all, 0);
        const totalSizeBytes = fileStats.reduce((acc, stats) => acc + (stats._sum.tamanho_bytes || 0), 0);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

        return {
            total_count: totalCount,
            total_tamanho_bytes: totalSizeBytes,
            total_tamanho_mb: totalSizeMB,
            mime_type: perMimeType,
        };
    }

    async getPessoaUsage(): Promise<any> {
        const pessoaCount = await this.prisma.pessoa.count();
        const pessoaAtivo = await this.prisma.pessoa.count({
            where: { desativado: false },
        });
        const pessoaSessaoAtiva = await this.prisma.pessoaSessaoAtiva.count({});
        const pessoaOnline = await this.prisma.$queryRaw`
            SELECT
                count(distinct pessoa_id) FILTER (WHERE criado_em > now() - '10 minutes'::interval) as "10min",
                count(distinct pessoa_id) AS "24hours"
            FROM pessoa_atividade_log
            WHERE criado_em >= now() - '24 Hours'::interval
        `;

        // busca os últimos 7 dias, quebra por 10 min,
        // conta users distintos
        // ordena por dia mais "ativo" dos últimos 7 dias
        const stats7days = await this.prisma.$queryRaw`
            WITH daily_counts AS (
                SELECT
                    DATE_TRUNC('day', criado_em) AS day,
                    FLOOR(EXTRACT(EPOCH FROM criado_em) / 600) AS interval_start,
                    pessoa_id
                FROM pessoa_atividade_log
                WHERE criado_em >= now() - '7 days'::interval
            )
            , interval_users AS (
                SELECT
                    day,
                    interval_start,
                    COUNT(DISTINCT pessoa_id) AS users_10min
                FROM daily_counts
                GROUP BY 1, 2
            )
            SELECT
                day::date::varchar as "day",
                MAX(users_10min)::int AS "max_users_10_min"
            FROM interval_users
            GROUP BY 1
            ORDER BY 2 DESC
        `;

        return {
            qtde_pessoas: pessoaCount,
            qtde_ativo: pessoaAtivo,
            qtde_sessoes_ativas: pessoaSessaoAtiva,
            qtde_users_online: pessoaOnline,
            stats: stats7days,
        };
    }

    @Get('tail-logs')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    // esconde o endpoint da documentação, pois o swagger não suporta streaming, e isso poderia criar uma situação
    // de espera infinita para o usuário
    @ApiExcludeEndpoint()
    async tailLog(@Res() res: Response) {
        const logFile = process.env.LOG_FILE;
        if (!logFile) {
            throw new BadRequestException('LOG_FILE environment variable not defined');
        }

        const resolvedLogFile = path.resolve(logFile);
        await this.handleLogStream(res, 'tail', ['-n', '1000', '-f', resolvedLogFile]);
    }

    @Get('cat-logs')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async catLog(@Res() res: Response) {
        const logFile = process.env.LOG_FILE;
        if (!logFile) {
            throw new BadRequestException('LOG_FILE environment variable not defined');
        }

        const resolvedLogFile = path.resolve(logFile);
        await this.handleLogStream(res, 'cat', [resolvedLogFile]);
    }

    private async handleLogStream(res: Response, command: string, args: string[]) {
        res.setHeader('Content-Type', 'text/plain');

        const process = spawn(command, args);

        process.stdout.on('data', (data) => {
            res.write(data);
        });

        process.stderr.on('data', (data) => {
            console.error(`Process stderr: ${data}`);
            res.write(data);
        });

        process.on('close', (code) => {
            console.log(`Process exited with code ${code}`);
            res.end();
        });

        res.on('close', () => {
            console.log('Client disconnected, stopping process.');
            process.kill();
        });
    }
}
