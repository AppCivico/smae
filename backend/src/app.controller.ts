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
    @Get('/performance-check')
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
}
