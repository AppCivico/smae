import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Periodicidade, Prisma, Serie } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from '../common/date2ymd';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ListSeriesAgrupadas } from '../variavel/dto/list-variavel.dto';
import {
    SerieIndicadorValorNominal,
    SerieIndicadorValorPorPeriodo,
    ValorSerieExistente,
} from '../variavel/entities/variavel.entity';
import { VariavelService } from '../variavel/variavel.service';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { FilterIndicadorDto, FilterIndicadorSerieDto } from './dto/filter-indicador.dto';
import { FormulaVariaveis, UpdateIndicadorDto } from './dto/update-indicador.dto';
import { Indicador } from './entities/indicador.entity';
import { IndicadorFormulaCompostaEmUsoDto } from './entities/indicador.formula-composta.entity';
import { CONST_CRONO_VAR_CATEGORICA_ID } from '../common/consts';

const FP = require('../../public/js/formula_parser.js');

@Injectable()
export class IndicadorService {
    private readonly logger = new Logger(IndicadorService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly variavelService: VariavelService
    ) {}

    async create(createIndicadorDto: CreateIndicadorDto, user: PessoaFromJwt) {
        console.log({ createIndicadorDto });
        if (!createIndicadorDto.meta_id && !createIndicadorDto.iniciativa_id && !createIndicadorDto.atividade_id)
            throw new HttpException(
                'Indicador deve ter no mínimo 1 relacionamento: Meta, Iniciativa ou Atividade',
                400
            );

        const countExistente = await this.prisma.indicador.count({
            where: {
                removido_em: null,
                meta_id: createIndicadorDto.meta_id,
                iniciativa_id: createIndicadorDto.iniciativa_id,
                atividade_id: createIndicadorDto.atividade_id,
            },
        });
        if (countExistente >= 1)
            throw new HttpException('Já existe um indicador para a Meta, Iniciativa ou Atividade', 400);

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const indicador = await prisma.indicador.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        ...createIndicadorDto,
                    },
                    select: {
                        id: true,
                        meta: {
                            select: {
                                iniciativa: {
                                    where: {
                                        compoe_indicador_meta: true,
                                        removido_em: null,
                                    },
                                    select: {
                                        Indicador: {
                                            where: {
                                                removido_em: null,
                                            },
                                            select: {
                                                id: true,
                                                iniciativa_id: true,
                                                IndicadorVariavel: {
                                                    select: {
                                                        variavel_id: true,
                                                    },
                                                },
                                            },
                                        },

                                        atividade: {
                                            where: {
                                                compoe_indicador_iniciativa: true,
                                                removido_em: null,
                                            },
                                            select: {
                                                Indicador: {
                                                    where: {
                                                        removido_em: null,
                                                    },
                                                    select: {
                                                        id: true,
                                                        atividade_id: true,
                                                        IndicadorVariavel: {
                                                            select: {
                                                                variavel_id: true,
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },

                        iniciativa: {
                            select: {
                                Indicador: {
                                    where: {
                                        removido_em: null,
                                    },
                                    select: {
                                        id: true,
                                        iniciativa_id: true,
                                        IndicadorVariavel: {
                                            select: {
                                                variavel_id: true,
                                            },
                                        },
                                    },
                                },

                                atividade: {
                                    where: {
                                        compoe_indicador_iniciativa: true,
                                        removido_em: null,
                                    },
                                    select: {
                                        Indicador: {
                                            where: {
                                                removido_em: null,
                                            },
                                            select: {
                                                id: true,
                                                atividade_id: true,
                                                IndicadorVariavel: {
                                                    select: {
                                                        variavel_id: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });

                const meta_id = await this.variavelService.getMetaIdDoIndicador(indicador.id, prisma);
                if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
                    const filterIdIn = await user.getMetaIdsFromAnyModel(
                        this.prisma.view_meta_pessoa_responsavel_na_cp
                    );
                    // vai dar rollback, mas ai n repete o codigo pelo menos
                    if (filterIdIn.includes(meta_id) === false)
                        throw new HttpException('Sem permissão para criar indicador para a meta', 400);
                }

                // Verifica se há variaveis que devem ser 'herdadas'
                if (indicador.meta) {
                    for (const iniciativa of indicador.meta.iniciativa) {
                        for (const indicador of iniciativa.Indicador) {
                            for (const variavel of indicador.IndicadorVariavel) {
                                const info = await this.variavelService.buscaIndicadorParaVariavel(indicador.id);

                                await this.variavelService.resyncIndicadorVariavel(info, variavel.variavel_id, prisma);
                            }
                        }

                        for (const atividade of iniciativa.atividade) {
                            for (const indicador of atividade.Indicador) {
                                for (const variavel of indicador.IndicadorVariavel) {
                                    const info = await this.variavelService.buscaIndicadorParaVariavel(indicador.id);

                                    await this.variavelService.resyncIndicadorVariavel(
                                        info,
                                        variavel.variavel_id,
                                        prisma
                                    );
                                }
                            }
                        }
                    }
                } else if (indicador.iniciativa) {
                    for (const atividade of indicador.iniciativa.atividade) {
                        for (const indicador of atividade.Indicador) {
                            for (const variavel of indicador.IndicadorVariavel) {
                                const info = await this.variavelService.buscaIndicadorParaVariavel(indicador.id);

                                await this.variavelService.resyncIndicadorVariavel(info, variavel.variavel_id, prisma);
                            }
                        }
                    }
                } else {
                    // Indicador de atividade já é o 'último nível'
                }

                return indicador;
            }
        );

        return created;
    }

    private async checkFormulaCompostasEmUsoId(
        indicadorId: number,
        formula_compilada: string,
        prismaTx: Prisma.TransactionClient
    ): Promise<number[]> {
        const neededFCs: Record<number, number> = {};
        this.extractFormulaCompostaFromFormula(formula_compilada, neededFCs);

        const ret: number[] = [];
        for (const formulaCompostaId of Object.keys(neededFCs)) {
            const formulaComposta = await prismaTx.formulaComposta.findFirstOrThrow({
                where: {
                    removido_em: null,
                    id: +formulaCompostaId,
                    IndicadorFormulaComposta: { some: { indicador_id: indicadorId } },
                },
                select: { id: true },
            });

            ret.push(formulaComposta.id);
        }

        return ret;
    }

    private extractFormulaCompostaFromFormula(formula_compilada: string, neededFCs: Record<number, number>) {
        for (const match of formula_compilada.matchAll(/@_\d+\b/g)) {
            const referencia = +match[0].replace('@_', '');
            if (!neededFCs[referencia]) neededFCs[referencia] = 0;
            neededFCs[referencia]++;
        }
    }

    private extractVariavelFromFormula(formula_compilada: string, neededRefs: Record<string, number>) {
        for (const match of formula_compilada.matchAll(/\$_\d+\b/g)) {
            const referencia = match[0].replace('$', '');
            if (!neededRefs[referencia]) neededRefs[referencia] = 0;
            neededRefs[referencia]++;
        }
    }

    async listFormulaCompostaEmUso(id: number, user: PessoaFromJwt): Promise<IndicadorFormulaCompostaEmUsoDto[]> {
        const fcEmUso = await this.prisma.indicadorFormulaCompostaEmUso.findMany({
            where: { indicador_id: id },
            select: {
                formula_composta_id: true,
                formula_composta: {
                    select: {
                        titulo: true,
                        nivel_regionalizacao: true,
                        mostrar_monitoramento: true,
                    },
                },
            },
        });

        return fcEmUso.map((e) => {
            return {
                formula_composta_id: e.formula_composta_id,
                titulo: e.formula_composta.titulo,
                nivel_regionalizacao: e.formula_composta.nivel_regionalizacao,
                mostrar_monitoramento: e.formula_composta.mostrar_monitoramento,
            };
        });
    }

    // deixa de ser private, o FormulaComposta usa pra conferir se tudo faz parte do indicador
    async validateVariaveis(
        formula_variaveis: FormulaVariaveis[] | null | undefined,
        indicador_id: number,
        formula: string
    ): Promise<string> {
        let formula_compilada = '';
        const neededRefs: Record<string, number> = {};
        const neededFCs: Record<number, number> = {};
        if (formula) {
            try {
                formula_compilada = FP.parse(formula.toLocaleUpperCase());
            } catch (error) {
                throw new HttpException(`formula| formula não foi entendida: ${formula}\n${error}`, 400);
            }

            this.extractVariavelFromFormula(formula_compilada, neededRefs);
            this.extractFormulaCompostaFromFormula(formula_compilada, neededFCs);
        }

        const uniqueRef: Record<string, boolean> = {};
        const variables: number[] = [];

        if (formula_variaveis && formula_variaveis.length > 0) {
            for (const fv of formula_variaveis) {
                if (!uniqueRef[fv.referencia]) {
                    uniqueRef[fv.referencia] = true;
                } else {
                    throw new HttpException(
                        `formula_variaveis| ${fv.referencia} duplicada, utilize apenas uma vez!`,
                        400
                    );
                }

                if (variables.includes(fv.variavel_id) == false) variables.push(+fv.variavel_id);
            }

            const count = await this.prisma.indicadorVariavel.count({
                where: {
                    desativado: false,
                    indicador_id: indicador_id,
                    variavel_id: {
                        in: variables,
                    },
                },
            });

            if (count !== variables.length) {
                const found = await this.prisma.indicadorVariavel.findMany({
                    where: {
                        indicador_id: indicador_id,
                        desativado: false,
                    },
                    select: { variavel_id: true },
                });

                throw new HttpException(
                    `formula_variaveis| Uma ou mais variável enviada não faz parte do indicador. Enviadas: ${JSON.stringify(
                        variables
                    )}, Existentes: ${JSON.stringify(found.map((e) => e.variavel_id))}`,
                    400
                );
            }
        }

        for (const neededRef of Object.keys(neededRefs)) {
            if (!uniqueRef[neededRef]) {
                throw new HttpException(
                    `formula_variaveis| Referencia ${neededRef} enviada na formula não foi declarada nas variáveis.`,
                    400
                );
            }
        }

        for (const formulaCompostaId of Object.keys(neededFCs)) {
            const formulaCompostaCount = await this.prisma.formulaComposta.count({
                where: {
                    removido_em: null,
                    id: +formulaCompostaId,
                    IndicadorFormulaComposta: { some: { indicador_id: indicador_id } },
                },
            });

            if (!formulaCompostaCount) {
                throw new HttpException(
                    `formula_variaveis| Referencia de fórmula composta @_${formulaCompostaId} enviada na formula não foi encontrada no indicador.`,
                    400
                );
            }
        }

        // TODO adicionar limpeza de formula_variaveis que não tiveram as referencias usadas

        return formula_compilada;
    }

    async findOne(indicador_id: number, user: PessoaFromJwt): Promise<Indicador | null> {
        const list = await this.findAll({ id: indicador_id }, user);

        return list.length ? list[0] : null;
    }

    async findAll(filters: FilterIndicadorDto | undefined = undefined, user: PessoaFromJwt): Promise<Indicador[]> {
        // TODO cruzar até chegar nas metas pra fazer o filtro (PDM.tecnico_cp) se necessário, mesma situação das variaveis

        const listActive = await this.prisma.indicador.findMany({
            where: {
                removido_em: null,
                id: filters?.id,
                meta_id: filters?.meta_id,
                iniciativa_id: filters?.iniciativa_id,
                atividade_id: filters?.atividade_id,
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                polaridade: true,
                periodicidade: true,
                regionalizavel: true,
                nivel_regionalizacao: true,
                inicio_medicao: true,
                fim_medicao: true,
                meta_id: true,
                iniciativa_id: true,
                atividade_id: true,
                contexto: true,
                complemento: true,
                formula_variaveis: {
                    select: {
                        referencia: true,
                        variavel_id: true,
                        janela: true,
                        usar_serie_acumulada: true,
                    },
                },
                formula: true,
                acumulado_usa_formula: true,
                acumulado_valor_base: true,
                casas_decimais: true,
                recalculando: true,
                recalculo_erro: true,
                recalculo_tempo: true,
            },
            orderBy: { criado_em: 'desc' },
        });

        return listActive;
    }

    async update(id: number, dto: UpdateIndicadorDto, user: PessoaFromJwt) {
        const indicadorSelectData = {
            id: true,
            formula_compilada: true,
            inicio_medicao: true,
            fim_medicao: true,
            acumulado_usa_formula: true,
            periodicidade: true,
            acumulado_valor_base: true,
            formula_variaveis: {
                select: {
                    variavel_id: true,
                    janela: true,
                    referencia: true,
                    usar_serie_acumulada: true,
                },
            },
        };
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: id },
            select: indicadorSelectData,
        });
        if (!indicador) throw new HttpException('indicador não encontrado', 400);

        const meta_id = await this.variavelService.getMetaIdDoIndicador(indicador.id, this.prisma);
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // quem é da CP pode editar
            const filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
            if (filterIdIn.includes(meta_id) === false)
                throw new HttpException('Sem permissão para editar indicador para a meta', 400);
        }

        console.log('updateIndicadorDto', dto);

        const formula_variaveis = dto.formula_variaveis;
        delete dto.formula_variaveis;
        let formula: string = dto.formula ? dto.formula : '';
        const antigaFormulaCompilada = indicador.formula_compilada || '';
        if (dto.formula_variaveis && !dto.formula) {
            formula = antigaFormulaCompilada;
        }

        if (formula && !formula_variaveis) {
            throw new HttpException(`É necessário enviar o parâmetro formula_variaveis quando enviar formula`, 400);
        } else if (!formula && formula_variaveis && formula_variaveis.length > 0) {
            throw new HttpException(`É necessário enviar o parâmetro formula quando enviar formula_variaveis`, 400);
        }

        let formula_compilada: string = await this.validateVariaveis(formula_variaveis, id, formula);

        // TODO rever isso aqui, pq não ta usando pra nada
        // pq ta errado a logica (salvando sempre)
        //const oldVersion = IndicadorService.getIndicadorHash(indicador);
        //this.logger.debug({ oldVersion });

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const indicador = await prismaTx.indicador.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...(dto as any), // hack pra enganar o TS que quer validar o campo que já apagamos (formula_variaveis)
                        formula_compilada: formula_compilada,
                        acumulado_usa_formula:
                            dto.acumulado_usa_formula === null ? undefined : dto.acumulado_usa_formula,
                    },
                    select: indicadorSelectData,
                });

                //const newVersion = IndicadorService.getIndicadorHash(indicador);
                //this.logger.debug({ oldVersion, newVersion });

                if (formula_variaveis) {
                    ({ formula, formula_compilada } = await this.trocaReferencias(
                        formula_variaveis,
                        formula,
                        indicador.id,
                        formula_compilada,
                        prismaTx
                    ));

                    await prismaTx.indicadorFormulaVariavel.deleteMany({
                        where: { indicador_id: indicador.id },
                    });
                    await Promise.all([
                        prismaTx.indicador.update({
                            where: { id: indicador.id },
                            data: { formula, formula_compilada },
                        }),
                        prismaTx.indicadorFormulaVariavel.createMany({
                            data: formula_variaveis.map((fv) => {
                                return {
                                    usar_serie_acumulada: fv.usar_serie_acumulada,
                                    indicador_id: indicador.id,
                                    janela: fv.janela,
                                    variavel_id: fv.variavel_id,
                                    referencia: fv.referencia,
                                };
                            }),
                        }),
                    ]);
                }

                await this.recalcIndicador(prismaTx, indicador.id);

                await prismaTx.indicadorFormulaCompostaEmUso.deleteMany({ where: { indicador_id: indicador.id } });
                if (formula_compilada) {
                    // Populando rows da tabela IndicadorFormulaCompostaEmUso
                    const formulasCompostasEmUso = await this.checkFormulaCompostasEmUsoId(
                        indicador.id,
                        formula_compilada,
                        prismaTx
                    );

                    if (formulasCompostasEmUso.length)
                        await prismaTx.indicadorFormulaCompostaEmUso.createMany({
                            data: formulasCompostasEmUso.map((formulaCompostaId) => {
                                return {
                                    indicador_id: indicador.id,
                                    formula_composta_id: formulaCompostaId,
                                };
                            }),
                        });
                }

                return indicador;
            },
            {
                isolationLevel: 'ReadCommitted',
                maxWait: 60 * 1000,
                timeout: 15 * 1000,
            }
        );

        return { id };
    }

    async recalcIndicador(prismaTx: Prisma.TransactionClient, indicador_id: number) {
        this.logger.log(`Indicador recalculando...`);
        await prismaTx.$queryRaw`select refresh_serie_indicador(${indicador_id}::int, null)`;
    }

    private static getIndicadorHash(indicador: {
        formula_variaveis: {
            variavel_id: number;
            referencia: string;
            janela: number;
            usar_serie_acumulada: boolean;
        }[];
        acumulado_valor_base: Prisma.Decimal | null;
        formula_compilada: string | null;
        acumulado_usa_formula: boolean;
        periodicidade: Periodicidade;
        inicio_medicao: Date;
        fim_medicao: Date;
    }): string {
        let str = [
            indicador.formula_compilada || '()',
            Date2YMD.toString(indicador.inicio_medicao),
            Date2YMD.toString(indicador.fim_medicao),
            indicador.acumulado_valor_base || '()',
            indicador.periodicidade,
            indicador.acumulado_usa_formula,
            indicador.formula_variaveis.length,
        ].join(',');
        indicador.formula_variaveis.sort((a, b) => ('' + a.referencia).localeCompare(b.referencia));
        for (const fv of indicador.formula_variaveis) {
            str += '-' + [fv.referencia, fv.janela, fv.variavel_id, fv.usar_serie_acumulada].join(',');
        }
        return str;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const meta_id = await this.variavelService.getMetaIdDoIndicador(id, this.prisma);
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            const filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
            if (filterIdIn.includes(meta_id) === false)
                throw new HttpException('Sem permissão para remover indicador para a meta', 400);
        }

        const removed = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            // Verificando se as variáveis deste indicador estão em uso.
            const varsInUse = await prismaTx.indicadorVariavel.count({
                where: {
                    indicador_origem_id: id,
                    desativado: false,
                },
            });

            if (varsInUse > 0) throw new HttpException('Indicador possui variáveis em uso.', 400);

            const cronoEmUso = await prismaTx.indicadorVariavel.count({
                where: {
                    indicador_id: id,
                    variavel: {
                        removido_em: null,
                        variavel_categorica_id: CONST_CRONO_VAR_CATEGORICA_ID,
                    },
                },
            });
            if (cronoEmUso > 0) throw new HttpException('Indicador possui variáveis de cronograma em uso.', 400);

            prismaTx.variavel.updateMany({
                where: {
                    indicador_variavel: {
                        some: {
                            indicador_id: id,
                        },
                    },
                },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_por: user.id,
                },
            });

            return await prismaTx.indicador.updateMany({
                where: { id: id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });

        return removed;
    }

    private getValorSerieExistentePorPeriodo(valoresExistentes: ValorSerieExistente[]): SerieIndicadorValorPorPeriodo {
        const porPeriodo = new SerieIndicadorValorPorPeriodo();
        for (const serieValor of valoresExistentes) {
            if (!porPeriodo[Date2YMD.toString(serieValor.data_valor)]) {
                porPeriodo[Date2YMD.toString(serieValor.data_valor)] = {
                    Previsto: undefined,
                    PrevistoAcumulado: undefined,
                    Realizado: undefined,
                    RealizadoAcumulado: undefined,
                };
            }

            porPeriodo[Date2YMD.toString(serieValor.data_valor)][serieValor.serie] = {
                data_valor: Date2YMD.toString(serieValor.data_valor),
                valor_nominal: serieValor.valor_nominal.toPrecision(),
                ha_conferencia_pendente: serieValor.ha_conferencia_pendente,
            };
        }

        return porPeriodo;
    }

    private async gerarPeriodosEntreDatas(
        start: Date,
        end: Date,
        periodicidade: Periodicidade,
        filters: FilterIndicadorSerieDto
    ): Promise<DateYMD[]> {
        const [startStr, endStr] = [Date2YMD.toString(start), Date2YMD.toString(end)];

        const filterStart = Date2YMD.toStringOrNull(filters.data_inicio || null);
        const filterEnd = Date2YMD.toStringOrNull(filters.data_fim || null);

        if (filterStart || filterEnd) {
            // versão com filtros
            const dados: Record<string, string>[] = await this.prisma.$queryRaw`
            select to_char(p.p, 'yyyy-mm-dd') as dt
            from generate_series(
                CASE WHEN ${filterStart}::date IS NULL THEN
                    ${startStr}::date
                ELSE
                    GREATEST(${filterStart}::date, ${startStr}::date) -- mais recente entre as datas
                END,
                CASE WHEN ${filterEnd}::date IS NULL THEN
                    ${endStr}::date
                ELSE
                    LEAST(${filterEnd}::date, ${endStr}::date) -- mais velhas entre as datas
                END
                (select periodicidade_intervalo(${periodicidade}::"Periodicidade"))
            ) p
        `;
            return dados.map((e) => e.dt);
        } else {
            // versao otimizada e sem chance de bugs
            const dados: Record<string, string>[] = await this.prisma.$queryRaw`
                select to_char(p.p, 'yyyy-mm-dd') as dt
                from generate_series(${startStr}::date, ${endStr}::date, (select periodicidade_intervalo(${periodicidade}::"Periodicidade"))) p
            `;
            return dados.map((e) => e.dt);
        }
    }

    private async getValorSerieExistente(indicadorId: number, series: Serie[]): Promise<ValorSerieExistente[]> {
        return await this.prisma.serieIndicador.findMany({
            where: {
                indicador_id: +indicadorId,
                serie: {
                    in: series,
                },
            },
            select: {
                id: true,
                serie: true,
                data_valor: true,
                valor_nominal: true,
                ha_conferencia_pendente: true,
            },
            orderBy: [{ serie: 'asc' }, { data_valor: 'asc' }],
        });
    }

    async getSeriesIndicador(
        id: number,
        user: PessoaFromJwt,
        filters: FilterIndicadorSerieDto
    ): Promise<ListSeriesAgrupadas> {
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: +id },
            select: { id: true, inicio_medicao: true, fim_medicao: true, periodicidade: true },
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 404);

        const result: ListSeriesAgrupadas = {
            variavel: undefined,
            linhas: [],
            ordem_series: ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'],
        };

        const valoresExistentes = await this.getValorSerieExistente(indicador.id, [
            'Previsto',
            'PrevistoAcumulado',
            'Realizado',
            'RealizadoAcumulado',
        ]);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes);

        const todosPeriodos = await this.gerarPeriodosEntreDatas(
            indicador.inicio_medicao,
            indicador.fim_medicao,
            indicador.periodicidade,
            filters
        );

        for (const periodoYMD of todosPeriodos) {
            const seriesExistentes: SerieIndicadorValorNominal[] = [];

            const existeValor = porPeriodo[periodoYMD];
            if (
                existeValor &&
                (existeValor.Previsto ||
                    existeValor.PrevistoAcumulado ||
                    existeValor.Realizado ||
                    existeValor.RealizadoAcumulado)
            ) {
                if (existeValor.Previsto) {
                    seriesExistentes.push(existeValor.Previsto);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'Previsto'
                }

                if (existeValor.PrevistoAcumulado) {
                    seriesExistentes.push(existeValor.PrevistoAcumulado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'PrevistoAcumulado'
                }

                if (existeValor.Realizado) {
                    seriesExistentes.push(existeValor.Realizado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'Realizado'
                }

                if (existeValor.RealizadoAcumulado) {
                    seriesExistentes.push(existeValor.RealizadoAcumulado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'RealizadoAcumulado'
                }
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'Previsto'
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'PrevistoAcumulado'
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'Realizado'
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD)); // 'RealizadoAcumulado'
            }

            result.linhas.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                // TODO: botar o label de acordo com a periodicidade"
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
            });
        }

        return result;
    }

    private buildNonExistingSerieValor(periodo: DateYMD): SerieIndicadorValorNominal {
        return {
            data_valor: periodo,
            valor_nominal: '',
        };
    }

    async trocaReferencias(
        formula_variaveis: FormulaVariaveis[],
        formula: string,
        indicador_id: number,
        formula_compilada: string,
        prismaTx: Prisma.TransactionClient
    ) {
        const variaveisRefs: Record<string, number> = {};
        this.extractVariavelFromFormula(formula, variaveisRefs);
        this.logger.verbose(`extractVariavelFromFormula: ${JSON.stringify(variaveisRefs)}`);

        const variaveisEmUso = new Set(Object.keys(variaveisRefs));

        this.logger.verbose(`variaveisEmUso: ${JSON.stringify(Array.from(variaveisEmUso))}`);

        // troca os valores sem trocar a referencia
        const fvEmUso = formula_variaveis.filter((item) => variaveisEmUso.has(item.referencia));
        formula_variaveis.length = 0;
        formula_variaveis.push(...fvEmUso);

        this.logger.verbose(`formula_variaveis após filtro do uso: ${JSON.stringify(formula_variaveis)}`);

        const emUsoNoDb = await this.listReferenciasIndicador(prismaTx, indicador_id);
        const emUsoNaFormula = formula_variaveis.map((r) => r.referencia);

        const allReferences = new Set([...emUsoNoDb, ...emUsoNaFormula]);

        this.logger.verbose(`Referencias já ocupadas: ${JSON.stringify(Array.from(allReferences))}`);
        // começa no 0, vai aumentando isso vai usando os slots 'em branco'
        // isso pq se não, o numero iria aumentar pra sempre que alguém salvasse mudando a formula
        let highestNumericReference = 1;

        let anyChanged = false;
        for (const newReference of formula_variaveis) {
            let updatedReference = newReference.referencia;

            while (allReferences.has(updatedReference)) {
                highestNumericReference += 1;
                updatedReference = `_${highestNumericReference}`;
            }

            if (updatedReference != newReference.referencia) {
                this.logger.debug(`Trocando referência ${newReference.referencia} => ${updatedReference}`);

                const regex = new RegExp(`\\$${newReference.referencia}\\b`, 'g');
                formula = formula.replace(regex, `$${updatedReference}`);

                allReferences.add(updatedReference);
                newReference.referencia = updatedReference;
                anyChanged = true;
            }
        }

        this.logger.verbose(`anyChanged: ${JSON.stringify(anyChanged)}`);
        if (anyChanged) {
            this.logger.debug(`Revalidando referencias...`);
            formula_compilada = await this.validateVariaveis(formula_variaveis, indicador_id, formula);
        } else {
            this.logger.debug(`Nenhuma troca de referência realizada.`);
        }

        this.logger.verbose(`new formula_variaveis: ${JSON.stringify(formula_variaveis)}`, formula, formula_compilada);

        return { formula, formula_compilada };
    }

    private async listReferenciasIndicador(
        prismaTx: Prisma.TransactionClient,
        indicador_id: number
    ): Promise<string[]> {
        const variaveis = await prismaTx.indicadorFormulaVariavel.findMany({
            distinct: ['referencia'],
            select: { 'referencia': true },
            where: {
                indicador_id: indicador_id,
            },
        });

        const formulaCompostas = await prismaTx.formulaCompostaVariavel.findMany({
            distinct: ['referencia'],
            select: { 'referencia': true },
            where: {
                formula_composta: {
                    removido_em: null,
                    IndicadorFormulaComposta: {
                        some: {
                            indicador_id: indicador_id,
                        },
                    },
                },
            },
        });

        return [...variaveis.map((r) => r.referencia), ...formulaCompostas.map((r) => r.referencia)];
    }
}
