import { Injectable } from '@nestjs/common';
import { FileOutput, ReportableService, ReportContext, UtilsService } from '../../utils/utils.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PainelService } from '../../../painel/painel.service';
import { RelMonitoramentoMensalPsFilterDTO } from './dto/create-monitoramento-mensal-filter.dto';


@Injectable()
export class MonitoramentoMensalIndicadorPs implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly painel: PainelService
    ) {}

    asJSON(dto: RelMonitoramentoMensalPsFilterDTO): Promise<any> {
        return Promise.resolve(undefined);
    }

    toFileOutput(params: any, ctx: ReportContext): Promise<FileOutput[]> {
        return Promise.resolve([]);
    }
}

export class MonitoramentoMensalVariaveisPs implements ReportableService {
    asJSON(params: any): Promise<any> {
        return Promise.resolve(undefined);
    }

    toFileOutput(params: any, ctx: ReportContext): Promise<FileOutput[]> {
        return Promise.resolve([]);
    }

}
