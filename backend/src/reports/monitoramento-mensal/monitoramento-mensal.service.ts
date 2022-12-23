import { Injectable } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { PainelService } from 'src/painel/painel.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelMonitoramentsoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RetMonitoramentoMensal } from './entities/monitoramento-mensal.entity';


const { Parser, transforms: { flatten } } = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];


@Injectable()
export class MonitoramentoMensalService implements ReportableService {

    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly painel: PainelService, // getSimplifiedPainelSeries
    ) { }

    async create(dto: CreateRelMonitoramentsoMensalDto): Promise<RetMonitoramentoMensal> {

        const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false });


        return {

        };

    }



    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as RetMonitoramentoMensal;

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });

        const out: FileOutput[] = [];

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(JSON.stringify({
                    params: params,
                    "horario": Date2YMD.tzSp2UTC(new Date())
                }), "utf8")
            },
            ...out
        ]
    }


}
