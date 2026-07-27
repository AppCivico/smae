import { HttpException, Injectable } from '@nestjs/common';
import { flatten } from '@json2csv/transforms';
import { DateTime } from 'luxon';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { ReportFileSchema, SchemaAwareReportableService } from '../post-process/report-schema';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, Path2FileName, ReportableService, UtilsService } from '../utils/utils.service';
import { PeriodoRelatorioPrevisaoCustoDto, SuperCreateRelPrevisaoCustoDto } from './dto/create-previsao-custo.dto';
import {
    RelPrevisaoCustoPdmCsvRow,
    RelPrevisaoCustoProjetoCsvRow,
    rotulosPdmPrevisaoCusto,
} from './entities/previsao-custo-csv.entity';
import { ListPrevisaoCustoDto, RelPrevisaoCustoDto } from './entities/previsao-custo.entity';

/**
 * `__` em vez do `.` do `DefaultTransforms`: o CSV bruto precisa de nomes de coluna que o
 * builder DuckDB não interprete como referência qualificada por fonte.
 */
const PrevisaoCustoFlattenTransforms = [flatten({ objects: true, arrays: true, separator: '__' })];

@Injectable()
export class PrevisaoCustoService implements ReportableService, SchemaAwareReportableService {
    constructor(
        private readonly utils: UtilsService,
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async asJSON(dto: SuperCreateRelPrevisaoCustoDto, user: PessoaFromJwt | null): Promise<ListPrevisaoCustoDto> {
        let ano: number;
        let filtroMetas: number[] | undefined = undefined;

        if (!dto.portfolio_id) dto.portfolio_id = undefined;
        if (!dto.projeto_id) dto.projeto_id = undefined;

        // sem portfolio_id e sem projeto_id = filtra por meta
        if (dto.portfolio_id === undefined && dto.projeto_id === undefined) {
            const { metas } = await this.utils.applyFilter(dto, { iniciativas: false, atividades: false }, user);

            filtroMetas = metas.map((r) => r.id);
        }

        if (
            dto.ano === undefined &&
            (dto.periodo_ano === undefined || dto.periodo_ano !== PeriodoRelatorioPrevisaoCustoDto.Corrente)
        )
            throw new HttpException('Ano de referência não informado', 400);

        if (dto.periodo_ano === PeriodoRelatorioPrevisaoCustoDto.Corrente || !dto.ano) {
            ano = DateTime.local({ zone: SYSTEM_TIMEZONE }).year;
        } else {
            ano = dto.ano;
        }

        const metaOrcamentos = await this.prisma.orcamentoPrevisto.findMany({
            where: {
                meta_id: filtroMetas ? { in: filtroMetas } : undefined,
                projeto_id: dto.projeto_id ? dto.projeto_id : undefined,
                ...(dto.portfolio_id
                    ? {
                          OR: [
                              { projeto: { portfolio_id: dto.portfolio_id } },
                              {
                                  projeto: {
                                      portfolios_compartilhados: {
                                          some: { portfolio_id: dto.portfolio_id, removido_em: null },
                                      },
                                  },
                              },
                          ],
                      }
                    : {}),
                ano_referencia: ano,
                removido_em: null,
                ultima_revisao: true,
            },
            select: {
                id: true,
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
                projeto: { select: { id: true, codigo: true, nome: true } },
                versao_anterior_id: true,
                criado_em: true,
                ano_referencia: true,
                custo_previsto: true,
                parte_dotacao: true,
                atualizado_em: true,
            },
            orderBy: [{ meta_id: 'asc' }, { criado_em: 'desc' }],
        });

        const list = metaOrcamentos.map((r) => {
            return {
                ...r,
                custo_previsto: r.custo_previsto.toFixed(2),
                projeto_atividade: '',
                parte_dotacao: this.expandirParteDotacao(r.parte_dotacao),
            };
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return {
            linhas: list,
        };
    }

    private expandirParteDotacao(parte_dotacao: string): string {
        const partes = parte_dotacao.split('.');
        if (partes[1] === '*') partes[1] = '**';
        if (partes[4] === '*') partes[4] = '****';
        if (partes[7] === '*') partes[7] = '********';
        return partes.join('.');
    }

    /**
     * Schema do CSV bruto — habilita o pós-processamento (rótulos, formatação pt-BR,
     * seleção/filtro/ordenação de colunas e XLSX tipado).
     *
     * O conjunto de colunas depende dos parâmetros: com `pdm_id` o arquivo começa por
     * Meta/Iniciativa/Atividade, sem ele começa por Projeto — a mesma decisão que o
     * `toFileOutput` tomava para montar o `fields`, agora tomada uma vez só aqui.
     *
     * Os rótulos de iniciativa/atividade vêm do PDM (`rotulo_iniciativa`/`rotulo_atividade`),
     * então são aplicados sobre os labels estáticos declarados na classe de linha.
     */
    async describeSchema(params: SuperCreateRelPrevisaoCustoDto): Promise<ReportFileSchema[]> {
        const pdm = await this.buscaPdmDoRelatorio(params);
        if (!pdm) return [getReportRowSchema(RelPrevisaoCustoProjetoCsvRow)];

        const schema = getReportRowSchema(RelPrevisaoCustoPdmCsvRow);
        const rotulos = rotulosPdmPrevisaoCusto(pdm.rotulo_iniciativa, pdm.rotulo_atividade);

        return [
            {
                ...schema,
                colunas: schema.colunas.map((c) => (rotulos[c.name] ? { ...c, label: rotulos[c.name]! } : c)),
            },
        ];
    }

    /** `null` quando o relatório não é de PDM (Portfólio de Projetos / Obras). */
    private async buscaPdmDoRelatorio(
        params: SuperCreateRelPrevisaoCustoDto
    ): Promise<{ rotulo_iniciativa: string; rotulo_atividade: string } | null> {
        if (!params.pdm_id) return null;
        return await this.prisma.pdm.findUnique({
            where: { id: params.pdm_id },
            select: { rotulo_iniciativa: true, rotulo_atividade: true },
        });
    }

    async toFileOutput(
        params: SuperCreateRelPrevisaoCustoDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        // em teoria custo previsto pode ficar pesado, mas por enquanto não temos muitos registros
        const dados = await this.asJSON(params, user);
        await ctx.resumoSaida('Previsão de Custo', dados.linhas.length);
        await ctx.progress(50);

        const out: FileOutput[] = [];

        if (dados.linhas.length) {
            const reportTmp = ctx.getTmpFile('previsao-custo.csv');

            // CSV bruto: cabeçalho com os nomes de máquina das colunas do schema, valores crus
            // e nenhuma lambda de formatação. Rótulos (inclusive os do PDM), separador decimal
            // pt-BR e `dd/mm/aaaa` vêm do schema, aplicados no pós-processamento.
            const [schema] = await this.describeSchema(params);

            const csvOptions: CsvWriterOptions<RelPrevisaoCustoDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: PrevisaoCustoFlattenTransforms,
                fields: schema.colunas.map((c) => c.name),
            };

            await WriteCsvToFile(dados.linhas, reportTmp.stream, csvOptions);

            out.push({
                name: 'previsao-custo.csv',
                localFile: reportTmp.path,
            });
        }

        await ctx.progress(99);

        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
