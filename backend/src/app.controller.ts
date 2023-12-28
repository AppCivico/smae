import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
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
    @Roles('SMAE.superadmin')
    @Get('/system/usage')
    async systemUsage() {
        return {
            arquivos: await this.getFileUsage(),
            pessoas: await this.getPessoaUsage(),
        };
    }

    @ApiBearerAuth('access-token')
    @Roles('SMAE.superadmin')
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
                await prismaTx.$queryRaw`select 1`;
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

        // Sort by size in descending order
        fileStats.sort((a, b) => {
            if (b._sum.tamanho_bytes !== null && a._sum.tamanho_bytes !== null)
                return b._sum.tamanho_bytes - a._sum.tamanho_bytes;
            return b._count._all - a._count._all;
        });

        // Convert bytes to megabytes (MB) and create a new array of objects
        const perMimeType = fileStats.map((stats) => ({
            mime_type: stats.mime_type,
            count: stats._count._all,
            tamanho_bytes: stats._sum.tamanho_bytes,
            tamanho_mb: stats._sum.tamanho_bytes ? (stats._sum.tamanho_bytes / (1024 * 1024)).toFixed(2) : null,
        }));

        // Calculate total count and total size
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

        return {
            pessoaCount,
            pessoaAtivo,
            totalLogin: pessoaSessaoAtiva,
        };
    }
}
