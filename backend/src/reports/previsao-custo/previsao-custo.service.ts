import { HttpException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Date2YMD } from '../../common/date2ymd';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { CreateRelPrevisaoCustoDto, PeriodoRelatorioPrevisaoCustoDto } from './dto/create-previsao-custo.dto';
import { ListPrevisaoCustoDto } from './entities/previsao-custo.entity';

const { Parser, transforms: { flatten } } = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

class RetornoRealizadoDb {
    plan_dotacao_ano_utilizado: string | null
    plan_dotacao_mes_utilizado: string | null
    plan_sof_val_orcado_atualizado: string | null
    plan_valor_planejado: string | null
    plan_dotacao_sincronizado_em: Date | null
    dotacao: string
    processo: string | null
    nota_empenho: string | null
    dotacao_valor_empenhado: string
    dotacao_valor_liquidado: string
    dotacao_mes_utilizado: string | null
    dotacao_ano_utilizado: string | null
    dotacao_sincronizado_em: string
    meta_id: string
    meta_codigo: string
    meta_titulo: string
    iniciativa_id: string
    iniciativa_codigo: string
    iniciativa_titulo: string
    atividade_id: string
    atividade_codigo: string
    atividade_titulo: string
    ano: string
    mes: string
    mes_corrente: boolean
    smae_valor_empenhado: string
    smae_valor_liquidado: string
    total_registros?: number
    orcamento_realizado_item_id?: number
}

class RetornoPlanejadoDb {
    plan_dotacao_ano_utilizado: string | null
    plan_dotacao_mes_utilizado: string | null
    plan_sof_val_orcado_atualizado: string
    plan_valor_planejado: string
    plan_dotacao_sincronizado_em: Date | null
    dotacao: string

    meta_id: string
    meta_codigo: string
    meta_titulo: string

    iniciativa_id: string
    iniciativa_codigo: string
    iniciativa_titulo: string

    atividade_id: string
    atividade_codigo: string
    atividade_titulo: string
    ano: string

    total_registros?: number
    orcamento_planejado_id?: number
}

@Injectable()
export class PrevisaoCustoService implements ReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) { }

    async create(dto: CreateRelPrevisaoCustoDto): Promise<ListPrevisaoCustoDto> {

        let ano: number;

        if (dto.periodo_ano === PeriodoRelatorioPrevisaoCustoDto.Corrente) {
            ano = DateTime.now().year;
        } else {
            if (!dto.ano)
                throw new HttpException('Ano deve ser enviado', 400);

            ano = dto.ano
        }

        const metaOrcamentos = await this.prisma.metaOrcamento.findMany({
            where: {
                AND: [
                    { meta_id: dto?.meta_id },
                ],
                ano_referencia: ano,
                removido_em: null,
            },
            select: {
                id: true,
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
                criado_em: true,
                ano_referencia: true,
                custo_previsto: true,
                parte_dotacao: true,
                atualizado_em: true
            },
            orderBy: [
                { meta_id: 'asc' },
                { criado_em: 'desc' },
            ]
        });

        let list = metaOrcamentos.map((r) => {
            return {
                ...r,
                custo_previsto: r.custo_previsto.toFixed(2),
                projeto_atividade: '',
                parte_dotacao: this.expandirParteDotacao(r.parte_dotacao)
            }
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return {
            linhas: list
        };

    }

    private expandirParteDotacao(parte_dotacao: string): string {
        const partes = parte_dotacao.split('.');
        if (partes[1] = '*') partes[1] = '**';
        if (partes[4] = '*') partes[4] = '****';
        if (partes[7] = '*') partes[7] = '********';
        return partes.join('.')
    }

    // private convertPlanejadoRow(db: RetornoPlanejadoDb): OrcamentoPlanejadoSaidaDto {
    //     const logs: string[] = [];

    //     if ("total_registros" in db && db.total_registros) {
    //         logs.push(`Total de Itens Consolidados ${db.total_registros}`)
    //     }
    //     if ("orcamento_planejado_id" in db && db.orcamento_planejado_id) {
    //         logs.push(`orcamento_planejado_id = ${db.orcamento_planejado_id}`)
    //     }

    //     return {
    //         meta: { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id },
    //         iniciativa: db.iniciativa_id ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id } : null,
    //         atividade: db.atividade_id ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id } : null,

    //         dotacao: db.dotacao,

    //         orgao: { codigo: '', nome: '' },
    //         unidade: { codigo: '', nome: '' },
    //         fonte: { codigo: '', nome: '' },

    //         plan_dotacao_sincronizado_em: db.plan_dotacao_sincronizado_em?.toISOString() ?? '',
    //         plan_sof_val_orcado_atualizado: db.plan_sof_val_orcado_atualizado,
    //         plan_valor_planejado: db.plan_valor_planejado,
    //         plan_dotacao_ano_utilizado: db.plan_dotacao_ano_utilizado?.toString() ?? '',
    //         plan_dotacao_mes_utilizado: db.plan_dotacao_mes_utilizado?.toString() ?? '',

    //         ano: db.ano,

    //         logs: logs
    //     }

    // }


    // private convertRealizadoRow(db: RetornoRealizadoDb): OrcamentoExecutadoSaidaDto {
    //     const logs: string[] = [];

    //     if ("total_registros" in db && db.total_registros) {
    //         logs.push(`Total de Itens Consolidados ${db.total_registros}`)
    //     }

    //     if ("orcamento_realizado_item_id" in db && db.orcamento_realizado_item_id) {
    //         logs.push(`orcamento_realizado_item_id = ${db.orcamento_realizado_item_id}`)
    //     }

    //     return {
    //         meta: { codigo: db.meta_codigo, titulo: db.meta_titulo, id: +db.meta_id },
    //         iniciativa: db.iniciativa_id ? { codigo: db.iniciativa_codigo, titulo: db.iniciativa_titulo, id: +db.iniciativa_id } : null,
    //         atividade: db.atividade_id ? { codigo: db.atividade_codigo, titulo: db.atividade_titulo, id: +db.atividade_id } : null,

    //         dotacao: db.dotacao,
    //         processo: db.processo,
    //         nota_empenho: db.nota_empenho,

    //         orgao: { codigo: '', nome: '' },
    //         unidade: { codigo: '', nome: '' },
    //         fonte: { codigo: '', nome: '' },

    //         plan_dotacao_sincronizado_em: db.plan_dotacao_sincronizado_em ? db.plan_dotacao_sincronizado_em.toISOString() : null,
    //         plan_sof_val_orcado_atualizado: db.plan_sof_val_orcado_atualizado,
    //         plan_valor_planejado: db.plan_valor_planejado,
    //         plan_dotacao_ano_utilizado: db.plan_dotacao_ano_utilizado?.toString() || null,
    //         plan_dotacao_mes_utilizado: db.plan_dotacao_mes_utilizado?.toString() || null,

    //         dotacao_sincronizado_em: db.dotacao_sincronizado_em,
    //         dotacao_valor_empenhado: db.dotacao_valor_empenhado,
    //         dotacao_valor_liquidado: db.dotacao_valor_liquidado,
    //         dotacao_ano_utilizado: db.dotacao_ano_utilizado?.toString() ?? '',
    //         dotacao_mes_utilizado: db.dotacao_mes_utilizado?.toString() ?? '',
    //         smae_valor_empenhado: db.smae_valor_empenhado,
    //         smae_valor_liquidado: db.smae_valor_liquidado,

    //         mes: db.mes,
    //         ano: db.ano,
    //         mes_corrente: db.mes_corrente,

    //         logs: logs
    //     }

    // }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        // const dados = myInput as ListOrcamentoExecutadoDto;
        // const dto = params as CreateOrcamentoExecutadoDto;

        // const pdm = await this.prisma.pdm.findUniqueOrThrow({ where: { id: pdm_id } });

        const out: FileOutput[] = [];

        // let camposAnoMes: any[] = [];
        // let camposAno: any[] = [];
        // if (dto.tipo == 'Analitico') {
        //     camposAnoMes = [
        //         { value: 'mes', label: 'mês' },
        //         'ano',
        //         {
        //             value: (r: RetornoRealizadoDb) => {
        //                 return r.mes_corrente ? 'Sim' : 'Não'
        //             }, label: 'mês corrente'
        //         }
        //     ];
        //     camposAno[0] = camposAnoMes[0];
        // }

        // const camposMetaIniAtv = [
        //     { value: 'meta.codigo', label: 'Código da Meta' },
        //     { value: 'meta.titulo', label: 'Título da Meta' },
        //     { value: 'meta.id', label: 'ID da Meta' },
        //     { value: 'iniciativa.codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
        //     { value: 'iniciativa.titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
        //     { value: 'iniciativa.id', label: 'ID da ' + pdm.rotulo_iniciativa },
        //     { value: 'atividade.codigo', label: 'Código da ' + pdm.rotulo_atividade },
        //     { value: 'atividade.titulo', label: 'Título da ' + pdm.rotulo_atividade },
        //     { value: 'atividade.id', label: 'ID da ' + pdm.rotulo_atividade },
        // ];

        // if (dados.linhas.length) {
        //     const json2csvParser = new Parser({
        //         ...DefaultCsvOptions,
        //         transforms: defaultTransform,
        //         fields: [
        //             ...camposAnoMes,
        //             ...camposMetaIniAtv,
        //             'dotacao',
        //             'processo',
        //             'nota_empenho',
        //             'orgao.codigo',
        //             'orgao.nome',
        //             'unidade.codigo',
        //             'unidade.nome',
        //             'fonte.codigo',
        //             'fonte.nome',
        //             'plan_dotacao_sincronizado_em',
        //             'plan_sof_val_orcado_atualizado',
        //             'plan_valor_planejado',
        //             'plan_dotacao_ano_utilizado',
        //             'plan_dotacao_mes_utilizado',
        //             'dotacao_sincronizado_em',
        //             'dotacao_valor_empenhado',
        //             'dotacao_valor_liquidado',
        //             'dotacao_ano_utilizado',
        //             'dotacao_mes_utilizado',
        //             'smae_valor_empenhado',
        //             'smae_valor_liquidado',
        //             'logs',
        //         ]
        //     });
        //     const linhas = json2csvParser.parse(dados.linhas.map((r) => { return { ...r, logs: r.logs.join("\r\n") } }));
        //     out.push({
        //         name: 'executado.csv',
        //         buffer: Buffer.from(linhas, "utf8")
        //     });
        // }

        // if (dados.linhas_planejado.length) {
        //     const json2csvParser = new Parser({
        //         ...DefaultCsvOptions,
        //         transforms: defaultTransform,
        //         fields: [
        //             ...camposAno,
        //             ...camposMetaIniAtv,
        //             'dotacao',
        //             'orgao.codigo',
        //             'orgao.nome',
        //             'unidade.codigo',
        //             'unidade.nome',
        //             'fonte.codigo',
        //             'fonte.nome',
        //             'plan_dotacao_sincronizado_em',
        //             'plan_sof_val_orcado_atualizado',
        //             'plan_valor_planejado',
        //             'plan_dotacao_ano_utilizado',
        //             'plan_dotacao_mes_utilizado',
        //             'logs',
        //         ]
        //     });
        //     const linhas = json2csvParser.parse(dados.linhas_planejado.map((r) => { return { ...r, logs: r.logs.join("\r\n") } }));
        //     out.push({
        //         name: 'planejado.csv',
        //         buffer: Buffer.from(linhas, "utf8")
        //     });
        // }

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
