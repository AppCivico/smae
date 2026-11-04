import { flatten } from '@json2csv/transforms';
import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { ReportFileSchema, SchemaAwareReportableService } from '../post-process/report-schema';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, Path2FileName, ReportableService } from '../utils/utils.service';
import { CreateRelTransferenciasOrcamentoDto } from './dto/create-transferencias-orcamento.dto';
import { RelTransferenciasOrcamentoCsvRow } from './entities/transferencias-orcamento-csv.entity';
import {
    RelatorioTransferenciasOrcamentoDto,
    RelTransferenciasOrcamentoDto,
} from './entities/transferencias-orcamento.entity';

const FlattenTransforms = [flatten({ objects: true, arrays: true, separator: '__' })];

type RetornoDb = {
    transferencia_id: number;
    transferencia_identificador: string;
    esfera: string;
    tipo: string;
    ano: number | null;
    distribuicao_id: number | null;
    distribuicao_nome: string | null;
    orgao_gestor: string | null;
    dotacao: string;
    dotacao_complemento: string | null;
    processo: string | null;
    nota_empenho: string | null;
    ano_referencia: number;
    mes: number;
    smae_valor_empenhado: string;
    smae_valor_liquidado: string;
    smae_percentual_empenho: string | null;
    smae_percentual_liquidado: string | null;
    dotacao_valor_empenhado: string | null;
    dotacao_valor_liquidado: string | null;
    dotacao_ano_utilizado: number | null;
    dotacao_mes_utilizado: number | null;
    dotacao_sincronizado_em: Date | null;
};

@Injectable()
export class TransferenciasOrcamentoService implements ReportableService, SchemaAwareReportableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async asJSON(dto: CreateRelTransferenciasOrcamentoDto): Promise<RelatorioTransferenciasOrcamentoDto> {
        if ((dto.ano_inicio && !dto.ano_fim) || (!dto.ano_inicio && dto.ano_fim)) {
            throw new HttpException('Para filtrar por ano, é necessário enviar ambos os anos.', 400);
        }

        const filtros: Prisma.Sql[] = [];
        if (dto.esfera) filtros.push(Prisma.sql`and t.esfera = ${dto.esfera}::"TransferenciaTipoEsfera"`);
        if (dto.tipo_id) filtros.push(Prisma.sql`and t.tipo_id = ${dto.tipo_id}::int`);
        if (dto.ano_inicio && dto.ano_fim)
            filtros.push(Prisma.sql`and o.ano_referencia between ${dto.ano_inicio}::int and ${dto.ano_fim}::int`);

        const rows: RetornoDb[] = await this.prisma.$queryRaw`
            with custos as (
                select
                    t.id as transferencia_id,
                    t.identificador as transferencia_identificador,
                    t.esfera::text as esfera,
                    tt.nome as tipo,
                    t.ano,
                    dr.id as distribuicao_id,
                    dr.nome as distribuicao_nome,
                    case when og.id is null then null else og.sigla || ' - ' || og.descricao end as orgao_gestor,
                    o.dotacao,
                    o.dotacao_complemento,
                    o.processo as processo_raw,
                    format_proc_sei_sinproc(o.processo) as processo,
                    o.nota_empenho,
                    o.ano_referencia,
                    i.mes,
                    to_char_numeric(i.valor_empenho::numeric) as smae_valor_empenhado,
                    to_char_numeric(i.valor_liquidado::numeric) as smae_valor_liquidado,
                    to_char_numeric(i.percentual_empenho::numeric) as smae_percentual_empenho,
                    to_char_numeric(i.percentual_liquidado::numeric) as smae_percentual_liquidado
                from orcamento_realizado o
                join orcamento_realizado_item i on i.orcamento_realizado_id = o.id
                    and i.mes_corrente = true
                    and i.sobrescrito_em is null
                join transferencia t on t.id = o.transferencia_id and t.removido_em is null
                join transferencia_tipo tt on tt.id = t.tipo_id
                left join distribuicao_recurso dr on dr.id = o.distribuicao_recurso_id
                left join orgao og on og.id = dr.orgao_gestor_id
                where o.removido_em is null
                and o.transferencia_id is not null
                ${filtros.length ? Prisma.join(filtros, ' ') : Prisma.empty}
            )
            select
                custos.*,
                to_char_numeric(coalesce(dn.empenho_liquido, drp.empenho_liquido, dre.empenho_liquido)::numeric) as dotacao_valor_empenhado,
                to_char_numeric(coalesce(dn.valor_liquidado, drp.valor_liquidado, dre.valor_liquidado)::numeric) as dotacao_valor_liquidado,
                coalesce(dn.mes_utilizado, drp.mes_utilizado, dre.mes_utilizado) as dotacao_mes_utilizado,
                coalesce(dn.ano_referencia, drp.ano_referencia, dre.ano_referencia) as dotacao_ano_utilizado,
                coalesce(dn.sincronizado_em, drp.sincronizado_em, dre.sincronizado_em) as dotacao_sincronizado_em
            from custos
            left join dotacao_realizado dre on custos.processo_raw is null
                and custos.dotacao = dre.dotacao and custos.ano_referencia = dre.ano_referencia
            left join dotacao_processo drp on custos.processo_raw is not null and custos.nota_empenho is null
                and custos.dotacao = drp.dotacao and custos.ano_referencia = drp.ano_referencia
                and custos.processo_raw = drp.dotacao_processo
            left join dotacao_processo_nota dn on custos.nota_empenho is not null
                and custos.dotacao = dn.dotacao
                and cast(split_part(custos.nota_empenho, '/', 2) as bigint) = dn.ano_referencia
                and custos.processo_raw = dn.dotacao_processo
                and custos.nota_empenho = dn.dotacao_processo_nota
            order by custos.transferencia_identificador, custos.distribuicao_id nulls first,
                custos.ano_referencia, custos.dotacao, custos.processo, custos.nota_empenho
        `;

        const linhas: RelTransferenciasOrcamentoDto[] = rows.map((r) => ({
            transferencia_id: r.transferencia_id,
            transferencia_identificador: r.transferencia_identificador,
            esfera: r.esfera,
            tipo: r.tipo,
            ano: r.ano,
            distribuicao_id: r.distribuicao_id,
            distribuicao_nome: r.distribuicao_nome,
            orgao_gestor: r.orgao_gestor,
            dotacao: `${r.dotacao}${r.dotacao_complemento ? '.' + r.dotacao_complemento : ''}`,
            processo: r.processo,
            nota_empenho: r.nota_empenho,
            ano_referencia: r.ano_referencia,
            mes: r.mes,
            acao_orcamentaria: this.dotacaoService.getAcaoOrcamentaria(r.dotacao),
            orgao: { codigo: '', nome: '' },
            unidade: { codigo: '', nome: '' },
            fonte: { codigo: '', nome: '' },
            smae_valor_empenhado: r.smae_valor_empenhado,
            smae_valor_liquidado: r.smae_valor_liquidado,
            smae_percentual_empenho: r.smae_percentual_empenho,
            smae_percentual_liquidado: r.smae_percentual_liquidado,
            dotacao_valor_empenhado: r.dotacao_valor_empenhado,
            dotacao_valor_liquidado: r.dotacao_valor_liquidado,
            dotacao_ano_utilizado: r.dotacao_ano_utilizado?.toString() ?? '',
            dotacao_mes_utilizado: r.dotacao_mes_utilizado?.toString() ?? '',
            dotacao_sincronizado_em: r.dotacao_sincronizado_em?.toISOString() ?? null,
        }));

        await this.dotacaoService.setManyOrgaoUnidadeFonte(linhas);

        return { linhas };
    }

    async describeSchema(_params: any): Promise<ReportFileSchema[]> {
        return [getReportRowSchema(RelTransferenciasOrcamentoCsvRow)];
    }

    async toFileOutput(params: CreateRelTransferenciasOrcamentoDto, ctx: ReportContext): Promise<FileOutput[]> {
        const dados = await this.asJSON(params);
        const [schema] = await this.describeSchema(params);

        const out: FileOutput[] = [];
        if (dados.linhas.length) {
            const tmp = ctx.getTmpFile('execucao-orcamentaria.csv');

            const csvOpts: CsvWriterOptions<RelTransferenciasOrcamentoDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: FlattenTransforms,
                fields: schema.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(dados.linhas, tmp.stream, csvOpts);

            out.push({ name: 'execucao-orcamentaria.csv', localFile: tmp.path });
        }

        await ctx.resumoSaida('Execução Orçamentária', dados.linhas.length);

        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
