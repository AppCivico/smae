import { Injectable } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { PainelService } from 'src/painel/painel.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RelPainelDetalhe, RelVarlSimplifiedSeries, RetMonitoramentoMensal } from './entities/monitoramento-mensal.entity';
import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';


const { Parser, transforms: { flatten } } = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

class PainelCsv {
    indicador_id?: string | null
    indicador_titulo?: string | null
    indicador_codigo?: string | null

    variavel_id?: string | null
    variavel_codigo?: string | null
    variavel_titulo?: string | null

    data: string
    Previsto?: string | null
    PrevistoAcumulado?: string | null
    Realizado?: string | null
    RealizadoAcumulado?: string | null

}

@Injectable()
export class MonitoramentoMensalService implements ReportableService {

    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly painel: PainelService,
        private readonly mmMf: MonitoramentoMensalMfService,
    ) { }

    async create(dto: CreateRelMonitoramentoMensalDto): Promise<RetMonitoramentoMensal> {

        dto.paineis = Array.isArray(dto.paineis) ? dto.paineis : [];

        const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false });

        console.log(metas);

        const metasArr = metas.map(r => r.id);

        const paineis_ret: RelPainelDetalhe[] = [];
        for (const painel of dto.paineis) {
            const painel_data = await this.painel.getPainelShortData({ painel_id: painel });
            if (!painel_data) continue;

            const ret = await this.painel.getSimplifiedPainelSeries({ painel_id: painel, metas_ids: metasArr });
            console.dir(ret, { depth: 6 });

            const linhas: RelVarlSimplifiedSeries[] = [];

            for (const r of ret) {
                if (r.series) {

                    for (const s of r.series) {
                        linhas.push(
                            {
                                indicador_id: r.indicador_id,
                                indicador_titulo: r.indicador_titulo,
                                indicador_codigo: r.indicador_codigo,
                                variavel_id: r.variavel_id,
                                variavel_codigo: r.variavel_codigo,
                                variavel_titulo: r.variavel_titulo,
                                data: s.data,
                                Previsto: s.Previsto,
                                PrevistoAcumulado: s.PrevistoAcumulado,
                                Realizado: s.Realizado,
                                RealizadoAcumulado: s.RealizadoAcumulado,
                            }
                        )
                    }
                }
            }

            paineis_ret.push({
                painel: { ...painel_data },
                linhas: linhas
            })
        }

        const monitoramento_fisico = await this.mmMf.create_mf(dto, metasArr);

        return {
            monitoramento_fisico,

            paineis: paineis_ret
        };

    }



    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as RetMonitoramentoMensal;

        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });

        const out: FileOutput[] = [];


        out.push(...await this.mmMf.getFiles(dados, pdm));

        for (const painel of dados.paineis) {
            if (painel.linhas.length == 0) continue;

            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: undefined
            });

            const linhas = json2csvParser.parse(painel.linhas);
            out.push({
                name: 'painel-' +
                    painel.painel.nome
                        .replace(/\s/g, '-')
                        .replace(/[^a-z0-9-\._]/g, '') +
                    '.' + painel.painel.id + '.' + painel.painel.periodicidade + '.csv',
                buffer: Buffer.from(linhas, "utf8")
            });
        }

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
