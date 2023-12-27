import { Injectable, Logger } from '@nestjs/common';
import { CreateRefreshMvDto } from './dto/create-refresh-mv.dto';
import { TaskableService } from '../entities/task.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { RetryPromise } from '../../common/retryPromise';

@Injectable()
export class RefreshMvService implements TaskableService {
    private readonly logger = new Logger(RefreshMvService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshMvDto, _taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(`Refreshing materialized view ${inputParams.mv_name}...`);

        try {
            await RetryPromise(
                () => this.prisma.$queryRawUnsafe(`REFRESH MATERIALIZED VIEW "${inputParams.mv_name}";`),
                100,
                1000,
                20
            );
        } catch (error) {
            if (error?.code == 'P2010' && error?.meta?.code == '42P01') {
                return {
                    success: false,
                    error,
                };
            } else {
                throw error;
            }
        }

        const took = Date.now() - before;
        return {
            success: true,
            took,
        };
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }
}
