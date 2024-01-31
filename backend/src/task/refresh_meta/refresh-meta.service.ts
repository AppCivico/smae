import { Injectable, Logger } from '@nestjs/common';
import { RetryPromise } from '../../common/retryPromise';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { CreateRefreshMetaDto } from './dto/create-refresh-mv.dto';

@Injectable()
export class RefreshMetaService implements TaskableService {
    private readonly logger = new Logger(RefreshMetaService.name);
    constructor(private readonly prisma: PrismaService) {}

    async executeJob(inputParams: CreateRefreshMetaDto, _taskId: string): Promise<any> {
        const before = Date.now();

        this.logger.verbose(`Refreshing meta ${inputParams.meta_id}...`);

        await RetryPromise(
            () =>
                this.prisma.$queryRaw`
                    select atualiza_meta_status_consolidado(
                      ${inputParams.meta_id}::int,
                      (select id from ciclo_fisico where ativo)
                    );
                `,
            10,
            100,
            20
        );

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
