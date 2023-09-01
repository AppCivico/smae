import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { IsPublic } from './auth/decorators/is-public.decorator';
import * as percentile from 'percentile';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
    constructor(private readonly prisma: PrismaService) {}

    @IsPublic()
    @Get('/ping')
    async ping() {
        return 'pong';
    }

    @IsPublic()
    @Get('/performance-check')
    async performanceCheck(@Query() query: Record<string, string>) {
        if (query.token !== process.env.HEALTH_CHECK_TOKEN)
            throw new HttpException('mismatched HEALTH_CHECK_TOKEN', 401);

        return {
            unloaded: await this.recordPerformance(30),
            loaded: await this.recordPerformance(0),
        };
    }

    async recordPerformance(delayTime: number) {
        let executionTimes: number[] = [];
        let start = Date.now();

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

        let min = executionTimes[0];
        let max = executionTimes[executionTimes.length - 1];
        let p50 = percentile(50, executionTimes);
        let p99 = percentile(99, executionTimes);
        let p999 = percentile(99.9, executionTimes);

        return { min, max, p50, p99, p999, executionTimes: executionTimes.length };
    }
}
