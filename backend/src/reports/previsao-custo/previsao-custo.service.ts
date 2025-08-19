import { HttpException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, ReportableService, UtilsService } from '../utils/utils.service';
import { PeriodoRelatorioPrevisaoCustoDto, SuperCreateRelPrevisaoCustoDto } from './dto/create-previsao-custo.dto';
import { ListPrevisaoCustoDto } from './entities/previsao-custo.entity';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { flatten } from '@json2csv/transforms';

@Injectable()
export class PrevisaoCustoService implements ReportableService {
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

    async toFileOutput(
        params: SuperCreateRelPrevisaoCustoDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        // em teoria custo previsto pode ficar pesado, mas por enquanto não temos muitos registros
        const dados = await this.asJSON(params, user);
        await ctx.resumoSaida('Previsão de Custo', dados.linhas.length);
        await ctx.progress(50);

        const pdm = params.pdm_id ? await this.prisma.pdm.findUnique({ where: { id: params.pdm_id } }) : undefined;

        const out: FileOutput[] = [];

        const camposProjeto = [
            { value: 'projeto.codigo', label: 'Código Projeto' },
            { value: 'projeto.nome', label: 'Nome do Projeto' },
            { value: 'projeto.id', label: 'ID do Projeto' },
        ];

        const campos = pdm
            ? [
                  { value: 'meta.codigo', label: 'Código da Meta' },
                  { value: 'meta.titulo', label: 'Título da Meta' },
                  { value: 'meta.id', label: 'ID da Meta' },
                  { value: 'iniciativa.codigo', label: 'Código da ' + pdm.rotulo_iniciativa },
                  { value: 'iniciativa.titulo', label: 'Título da ' + pdm.rotulo_iniciativa },
                  { value: 'iniciativa.id', label: 'ID da ' + pdm.rotulo_iniciativa },
                  { value: 'atividade.codigo', label: 'Código da ' + pdm.rotulo_atividade },
                  { value: 'atividade.titulo', label: 'Título da ' + pdm.rotulo_atividade },
                  { value: 'atividade.id', label: 'ID da ' + pdm.rotulo_atividade },
              ]
            : camposProjeto;

        if (dados.linhas.length) {
            const transforms = [flatten()];

            const reportTmp = ctx.getTmpFile('previsao-custo.csv');

            const csvOptions: CsvWriterOptions<any> = {
                csvOptions: DefaultCsvOptions,
                transforms,
                fields: [
                    ...campos,
                    'id',
                    'id_versao_anterior',
                    'projeto_atividade',
                    'criado_em',
                    'ano_referencia',
                    'custo_previsto',
                    'parte_dotacao',
                    'atualizado_em',
                ],
            };

            await WriteCsvToFile(dados.linhas, reportTmp.stream, csvOptions);
            
            out.push({
                name: 'previsao-custo.csv',
                localFile: reportTmp.path,
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
