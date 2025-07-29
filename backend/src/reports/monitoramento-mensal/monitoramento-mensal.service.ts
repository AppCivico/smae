import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { PainelService } from '../../painel/painel.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import {
    RelPainelDetalhe,
    RelVarlSimplifiedSeries,
    RetMonitoramentoMensal,
} from './entities/monitoramento-mensal.entity';
import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class MonitoramentoMensalService implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly painel: PainelService,
        private readonly mmMf: MonitoramentoMensalMfService
    ) {}

    async asJSON(dto: CreateRelMonitoramentoMensalDto, user: PessoaFromJwt | null): Promise<RetMonitoramentoMensal> {
        dto.paineis = Array.isArray(dto.paineis) ? dto.paineis : [];

        const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false }, user);
        const metasArr = metas.map((r) => r.id);
        // um dia aqui é capaz que fiquem muitas metas e o retorno fique muito grande e cause OOM no asJSON
        if (metasArr.length > 10000)
            throw new Error(
                'Mais de 10000 indicadores encontrados, por favor refine a busca ou utilize o relatório em CSV'
            );

        const paineis_ret: RelPainelDetalhe[] = [];

        for (const painel of dto.paineis) {
            const painel_data = await this.painel.getPainelShortData({ painel_id: painel });
            if (!painel_data) continue;

            const linhas = await this.runPainelReport(painel, metasArr);
            paineis_ret.push({
                painel: painel_data,
                linhas: linhas,
            });
        }

        const monitoramento_fisico = await this.mmMf.create_mf(dto, metasArr);

        return {
            monitoramento_fisico,
            paineis: paineis_ret,
        };
    }

    private async runPainelReport(painel: number, metasArr: number[]): Promise<RelVarlSimplifiedSeries[]> {
        const ret = await this.painel.getSimplifiedPainelSeries({ painel_id: painel, metas_ids: metasArr });

        const linhas: RelVarlSimplifiedSeries[] = [];

        for (const r of ret) {
            if (r.series) {
                for (const s of r.series) {
                    if (!s.Previsto && !s.PrevistoAcumulado && !s.Realizado && !s.RealizadoAcumulado) continue;

                    linhas.push({
                        meta_id: r.meta_id,
                        meta_codigo: r.meta_codigo,
                        meta_titulo: r.meta_titulo,
                        iniciativa_id: r.iniciativa_id,
                        iniciativa_codigo: r.iniciativa_codigo,
                        iniciativa_titulo: r.indicador_titulo,
                        atividade_id: r.atividade_id,
                        atividade_codigo: r.atividade_codigo,
                        atividade_titulo: r.atividade_titulo,
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
                    });
                }
            }
        }
        return linhas;
    }

    async toFileOutput(
        params: CreateRelMonitoramentoMensalDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: params.pdm_id } });
        params.paineis = Array.isArray(params.paineis) ? params.paineis : [];

        const { metas } = await this.utils.applyFilter(params, { iniciativas: false, atividades: false }, user);
        const metasArr = metas.map((r) => r.id);
        await ctx.progress(1);

        let monitoramento_fisico = await this.mmMf.create_mf(params, metasArr);
        ctx.resumoSaida('Séries Variáveis', monitoramento_fisico?.seriesVariaveis.length);

        const out: FileOutput[] = [];

        out.push(...(await this.mmMf.getFiles({ monitoramento_fisico, paineis: [] }, pdm)));
        monitoramento_fisico = null; // libera memória

        const fieldsCSV = [
            { value: 'meta_codigo', label: 'Código da Meta' },
            { value: 'meta_titulo', label: 'Título da Meta' },
            { value: 'meta_id', label: 'ID da Meta' },

            { value: 'iniciativa_codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa_titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
            { value: 'iniciativa_id', label: 'ID da ' + pdm.rotulo_iniciativa },
            { value: 'atividade_codigo', label: 'Código da ' + pdm.rotulo_atividade },
            { value: 'atividade_titulo', label: 'Título da ' + pdm.rotulo_atividade },
            { value: 'atividade_id', label: 'ID da ' + pdm.rotulo_atividade },
            { value: 'variavel_id', label: 'ID da Variável' },
            { value: 'variavel_codigo', label: 'Código da Variável' },
            { value: 'variavel_titulo', label: 'Título da Variável' },
            { value: 'data', label: 'Data' },
            { value: 'Previsto', label: 'Previsto' },
            { value: 'PrevistoAcumulado', label: 'PrevistoAcumulado' },
            { value: 'Realizado', label: 'Realizado' },
            { value: 'RealizadoAcumulado', label: 'RealizadoAcumulado' },
        ];

        await ctx.progress(40);

        const totalPainel = params.paineis.length;
        let curPainel = 0;
        for (const painelId of params.paineis) {
            curPainel++;

            await ctx.progress(50 + 50 * (curPainel / totalPainel));
            const painel = await this.painel.getPainelShortData({ painel_id: painelId });
            if (!painel) continue;

            const linhas = await this.runPainelReport(painelId, metasArr);
            if (linhas.length === 0) continue;

            out.push(
                ...(await this.mmMf.getFiles(
                    {
                        monitoramento_fisico: null,
                        paineis: [{ painel, linhas }],
                    },
                    pdm
                ))
            );

            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [...fieldsCSV],
            });

            const linhasBuff = json2csvParser.parse(linhas);
            out.push({
                name:
                    'painel-' +
                    painel.nome.replace(/\s/g, '-').replace(/[^a-z0-9-._]/g, '') +
                    '.' +
                    painel.id +
                    '.' +
                    painel.periodicidade +
                    '.csv',
                buffer: Buffer.from(linhasBuff, 'utf8'),
            });
        }
        await ctx.progress(99);

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8'
                ),
            },
            ...out,
        ];
    }
}
