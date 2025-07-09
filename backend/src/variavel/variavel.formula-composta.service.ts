import { BadRequestException, HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Prisma, TipoPdm } from 'src/generated/prisma/client';
import { plainToInstance } from 'class-transformer';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { Date2YMD } from '../common/date2ymd';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { LinkIndicadorVariavelDto, UnlinkIndicadorVariavelDto } from '../indicador/dto/create-indicador.dto';
import { IndicadorFormulaCompostaService } from '../indicador/indicador.formula-composta.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilterVariavelDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas } from './dto/list-variavel.dto';
import {
    CreatePSFormulaCompostaDto,
    FilterFormulaCompostaDto,
    FilterPeriodoFormulaCompostaDto,
    PSFormulaCompostaDto,
    PeriodoFormulaCompostaDto,
    UpdatePSFormulaCompostaDto,
} from './dto/variavel.formula-composta.dto';
import { TipoUso, VariavelItemDto } from './entities/variavel.entity';
import { ORDEM_SERIES_RETORNO, VariavelService } from './variavel.service';

@Injectable()
export class VariavelFormulaCompostaService {
    private readonly logger = new Logger(VariavelFormulaCompostaService.name);
    constructor(
        private readonly prisma: PrismaService,
        //
        @Inject(forwardRef(() => VariavelService))
        private readonly variavelService: VariavelService,
        //
        @Inject(forwardRef(() => IndicadorFormulaCompostaService))
        private readonly indicadorFCService: IndicadorFormulaCompostaService
    ) {}

    async getFormulaCompostaPeriodos(tipo: TipoPdm, formula_composta_id: number): Promise<PeriodoFormulaCompostaDto[]> {
        const { variaveis } = await this.buscaVariaveisDaFormulaComposta(formula_composta_id);

        let indicadorId: number | null = null;
        if (tipo == 'PDM') {
            const indicador = await this.prisma.indicador.findFirst({
                where: {
                    FormulaComposta: {
                        some: {
                            desativado: false,
                            formula_composta_id: formula_composta_id,
                        },
                    },
                },
                select: { id: true },
            });
            if (!indicador) throw new BadRequestException('Indicador não encontrado para a fórmula composta');
            indicadorId = indicador.id;
        }

        const dados: Record<string, string>[] = await this.prisma.$queryRawUnsafe(`
            SELECT
                to_char(p.p, 'yyyy-mm-dd') AS dt,
                cast(count(distinct n.variavel_id) as int) AS variaveis
            FROM (SELECT unnest(ARRAY[${variaveis}]::int[]) AS variavel_id) n
            CROSS JOIN busca_periodos_variavel(n.variavel_id ${indicadorId ? `, ${indicadorId}::int` : ''})
                AS g(p, inicio, fim),
                generate_series(inicio, fim, p) p
            GROUP BY 1`);

        return plainToInstance(PeriodoFormulaCompostaDto, dados);
    }

    private async buscaVariaveisDaFormulaComposta(formula_composta_id: number) {
        const formula_composta = await this.prisma.formulaComposta.findFirst({
            where: { removido_em: null, id: formula_composta_id },
            select: { id: true, titulo: true },
        });
        if (!formula_composta) throw new BadRequestException('Formula composta não encontrada');

        const fc_variaveis = await this.prisma.formulaCompostaVariavel.groupBy({
            by: ['variavel_id'],
            where: {
                formula_composta_id: formula_composta_id,
            },
        });

        const variaveis = fc_variaveis.map((r) => r.variavel_id);
        return { formula_composta, variaveis };
    }

    async getFormulaCompostaSeries(
        formula_composta_id: number,
        filter: FilterPeriodoFormulaCompostaDto,
        user: PessoaFromJwt,
        uso: TipoUso = 'escrita'
    ): Promise<ListSeriesAgrupadas> {
        // TODO: Implementar verificação de permissão, não deve ser retornado o token de acesso
        // para os usuários que não possuem permissão de escrita na variável (quem não está na meta e etc)
        // talvez invertendo a lógica, verificar se o usuário tem permissão na hora da escrita
        // e não na hora da leitura ajude a simplificar o código
        // TODO v2: plano setorial agora também chama este método
        const { formula_composta, variaveis } = await this.buscaVariaveisDaFormulaComposta(formula_composta_id);

        const result: ListSeriesAgrupadas = {
            linhas: [],
            formula_composta: { id: formula_composta.id, titulo: formula_composta.titulo },
            ordem_series: ORDEM_SERIES_RETORNO,
        };

        const periodoYMD = Date2YMD.toString(filter.periodo);

        const listaVariaveis = await this.prisma.variavel.findMany({
            where: { id: { in: variaveis }, removido_em: null },
            select: {
                id: true,
                acumulativa: true,
                casas_decimais: true,
                periodicidade: true,
                codigo: true,
                titulo: true,
                suspendida_em: true,
                valor_base: true,
                variavel_categorica_id: true,
                recalculando: true,
                recalculo_erro: true,
                recalculo_tempo: true,
                variavel_mae_id: true,
                unidade_medida: { select: { id: true, sigla: true, descricao: true } },
            },
        });

        const promises = variaveis.map(async (variavelId) => {
            const variavel = listaVariaveis.filter((r) => r.id == variavelId)[0];
            if (!variavel) return;

            const valoresExistentes = await this.variavelService.getValorSerieExistente(
                variavelId,
                ORDEM_SERIES_RETORNO,
                { data_valor: filter.periodo }
            );

            const porPeriodo = this.variavelService.getValorSerieExistentePorPeriodo(
                valoresExistentes,
                variavelId,
                uso,
                user
            );
            const seriesExistentes = this.variavelService.populaSeriesExistentes(
                porPeriodo,
                periodoYMD,
                variavelId,
                variavel,
                uso,
                user
            );

            result.linhas.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
                variavel: {
                    ...{ ...variavel, valor_base: variavel.valor_base.toString(), suspendida_em: undefined },
                    suspendida: variavel.suspendida_em ? true : false,
                },
            });
        });

        await Promise.all(promises);

        result.linhas.sort((a, b) => {
            if (a.variavel && b.variavel) {
                return a.variavel.titulo.localeCompare(b.variavel.titulo);
            }
            return a.periodo.localeCompare(b.periodo);
        });

        return result;
    }

    async findAll(filter: FilterFormulaCompostaDto, user: PessoaFromJwt): Promise<PSFormulaCompostaDto[]> {
        const rows = await this.prisma.formulaComposta.findMany({
            where: {
                id: filter.id,
                removido_em: null,
                autogerenciavel: false,
                criar_variavel: true,
                tipo_pdm: 'PS',
            },
            orderBy: {
                titulo: 'asc',
            },
            select: {
                id: true,
                titulo: true,
                formula: true,
                FormulaCompostaVariavel: true,
                mostrar_monitoramento: true,
                nivel_regionalizacao: true,
                calc_casas_decimais: true,
                calc_periodicidade: true,
                calc_regionalizavel: true,
                calc_inicio_medicao: true,
                calc_fim_medicao: true,
                calc_orgao: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                calc_codigo: true,
                variavel_calc_erro: true,
                variavel_calc: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                titulo: r.titulo,
                formula: r.formula,
                formula_variaveis: r.FormulaCompostaVariavel.map((v) => {
                    return {
                        janela: v.janela,
                        referencia: v.referencia,
                        usar_serie_acumulada: v.usar_serie_acumulada,
                        variavel_id: v.variavel_id,
                    };
                }),
                mostrar_monitoramento: r.mostrar_monitoramento,
                nivel_regionalizacao: r.nivel_regionalizacao,
                casas_decimais: r.calc_casas_decimais,
                periodicidade: r.calc_periodicidade,
                regionalizavel: r.calc_regionalizavel,
                inicio_medicao: Date2YMD.toStringOrNull(r.calc_inicio_medicao),
                fim_medicao: Date2YMD.toStringOrNull(r.calc_fim_medicao),
                orgao: r.calc_orgao,
                codigo: r.calc_codigo,
                variavel_calc_erro: r.variavel_calc_erro,
                variavel_calc: r.variavel_calc,
            } satisfies PSFormulaCompostaDto;
        });
    }

    async findAllVariaveis(id: number, filters: FilterVariavelDto): Promise<VariavelItemDto[]> {
        filters.formula_composta_id = id;
        return this.variavelService.findAll('Global', filters);
    }

    async assertFormulaCompostaNaoGerenciada(id: number) {
        const item = await this.prisma.formulaComposta.findFirst({
            where: {
                id: id,
                removido_em: null,
                autogerenciavel: false,
                tipo_pdm: 'PS',
            },
        });
        if (!item) throw new BadRequestException('Formula composta não encontrada');
    }

    async linkVariavel(id: number, dto: LinkIndicadorVariavelDto, user: PessoaFromJwt): Promise<void> {
        await this.assertFormulaCompostaNaoGerenciada(id);

        const formulaComposta = await this.prisma.formulaComposta.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: { calc_inicio_medicao: true, calc_fim_medicao: true },
        });
        if (!formulaComposta.calc_inicio_medicao) throw new HttpException('Falta data de início de medição', 400);
        if (!formulaComposta.calc_fim_medicao) throw new HttpException('Falta data de fim de medição', 400);

        const variaveisDb = await this.prisma.variavel.findMany({
            where: {
                id: { in: dto.variavel_ids },
                tipo: {
                    in: ['Calculada', 'Global'],
                },
                removido_em: null,
            },
            select: { id: true, inicio_medicao: true, fim_medicao: true, titulo: true, codigo: true, tipo: true },
        });
        const alreadyInFC = await this.prisma.formulaCompostaRelVariavel.findMany({
            where: {
                variavel_id: { in: dto.variavel_ids },
                formula_composta_id: id,
            },
            select: { variavel_id: true },
        });
        const alreadyLinkedIds = new Set(alreadyInFC.map((item) => item.variavel_id));

        for (const varId of dto.variavel_ids) {
            // pula se já tem, nem valida os dados, isso é apenas para não compilar o frontend se caso venha duplicado
            if (alreadyLinkedIds.has(varId)) continue;

            const variavel = variaveisDb.find((e) => e.id == varId);
            if (!variavel) throw new HttpException(`Variável ${varId} não encontrada`, 400);
            if (variavel.tipo == 'Calculada')
                throw new HttpException(
                    `A variável ${variavel.titulo} (${variavel.codigo}) é calculada, não pode ser usada em fórmulas compostas`,
                    400
                );

            if (variavel.inicio_medicao == null)
                throw new HttpException(
                    `Variável ${variavel.titulo} (${variavel.codigo}) não possui data de início de medição`,
                    400
                );

            if (variavel.inicio_medicao && formulaComposta.calc_inicio_medicao < variavel.inicio_medicao)
                throw new HttpException(
                    `A variável ${variavel.titulo} (${variavel.codigo}) inicia a medição em ${Date2YMD.dbDateToDMY(
                        variavel.inicio_medicao
                    )}, enquanto a fórmula composta inicia em ${Date2YMD.dbDateToDMY(formulaComposta.calc_inicio_medicao)}`,
                    400
                );

            if (variavel.fim_medicao && formulaComposta.calc_fim_medicao > variavel.fim_medicao)
                throw new HttpException(
                    `A variável ${variavel.titulo} (${variavel.codigo}) termina a medição em ${Date2YMD.dbDateToDMY(
                        variavel.fim_medicao
                    )}, enquanto a fórmula composta termina em ${Date2YMD.dbDateToDMY(formulaComposta.calc_fim_medicao)}`,
                    400
                );
        }

        const variableIdsToLink = dto.variavel_ids.filter((varId) => !alreadyLinkedIds.has(varId));
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<void> => {
            await prisma.formulaCompostaRelVariavel.createMany({
                data: variableIdsToLink.map(
                    (varId) =>
                        ({
                            variavel_id: varId,
                            formula_composta_id: id,
                            // aviso_data_fim: false, oh duvida cruel
                        }) satisfies Prisma.FormulaCompostaRelVariavelCreateManyInput
                ),
            });
        });

        return;
    }

    async unlinkVariavel(id: number, dto: UnlinkIndicadorVariavelDto, user: PessoaFromJwt): Promise<void> {
        await this.assertFormulaCompostaNaoGerenciada(id);

        const alreadyInIndicador = await this.prisma.indicadorVariavel.findFirst({
            where: {
                variavel_id: dto.variavel_id,
                indicador_id: id,
                desativado: false,
                indicador_origem_id: null,
            },
            select: { variavel_id: true },
        });
        // se não existe, já ta desvinculado
        if (!alreadyInIndicador) return;

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            const emUso = await prismaTx.formulaCompostaVariavel.count({
                where: {
                    variavel_id: dto.variavel_id,
                    formula_composta_id: id,
                },
            });
            if (emUso > 0) {
                throw new HttpException(`A variável ${dto.variavel_id} está em uso na fórmula composta ${id}`, 400);
            }

            await prismaTx.formulaCompostaRelVariavel.deleteMany({
                where: {
                    variavel_id: dto.variavel_id,
                    formula_composta_id: id,
                },
            });
        });

        return;
    }

    async createPS(dto: CreatePSFormulaCompostaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.indicadorFCService.createPS(dto, user);
    }

    async updateById(id: number, dto: UpdatePSFormulaCompostaDto, user: PessoaFromJwt) {
        return await this.indicadorFCService.updateById(null, id, dto, user);
    }

    async removeById(id: number, user: PessoaFromJwt): Promise<void> {
        await this.assertFormulaCompostaNaoGerenciada(id);

        return await this.indicadorFCService.removeById(id, user);
    }
}
