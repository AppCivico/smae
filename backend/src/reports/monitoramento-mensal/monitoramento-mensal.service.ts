import { Injectable } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { PainelService } from 'src/painel/painel.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RetMonitoramentoMensal } from './entities/monitoramento-mensal.entity';
import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';


const { Parser, transforms: { flatten } } = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];


@Injectable()
export class MonitoramentoMensalService implements ReportableService {

    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly painel: PainelService,
        private readonly mmMf: MonitoramentoMensalMfService,
    ) { }

    async create(dto: CreateRelMonitoramentoMensalDto): Promise<RetMonitoramentoMensal> {

        const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false });

        console.log(metas);

        const metasArr = metas.map(r => r.id);

        for (const painel of dto.paineis) {

            const ret = await this.painel.getSimplifiedPainelSeries({ painel_id: painel, metas_ids: metasArr });
            console.dir(ret, { depth: 6 });

        }



        // XXX
        const monitoramento_fisico = await this.mmMf.create_mf(dto, metasArr);
        // XXX

        return {
            monitoramento_fisico,

            paineis: []

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
