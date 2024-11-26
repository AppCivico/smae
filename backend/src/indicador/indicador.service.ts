import { BadRequestException, HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Periodicidade, Prisma, Serie, TipoPdm } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CONST_CRONO_VAR_CATEGORICA_ID } from '../common/consts';
import { Date2YMD, DateYMD } from '../common/date2ymd';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaService } from '../meta/meta.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListSeriesAgrupadas } from '../variavel/dto/list-variavel.dto';
import {
    SerieIndicadorValorNominal,
    SerieIndicadorValorPorPeriodo,
    ValorSerieExistente,
} from '../variavel/entities/variavel.entity';
import { VariavelService } from '../variavel/variavel.service';
import { CreateIndicadorDto, LinkIndicadorVariavelDto, UnlinkIndicadorVariavelDto } from './dto/create-indicador.dto';
import { FilterIndicadorDto, FilterIndicadorSerieDto } from './dto/filter-indicador.dto';
import { FormulaVariaveis, UpdateIndicadorDto } from './dto/update-indicador.dto';
import { Indicador } from './entities/indicador.entity';
import { IndicadorFormulaCompostaEmUsoDto } from './entities/indicador.formula-composta.entity';

const FP = require('../../public/js/formula_parser.js');

@Injectable()
export class IndicadorService {
    private readonly logger = new Logger(IndicadorService.name);

    constructor(
        private readonly prisma: PrismaService,

        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService,
        @Inject(forwardRef(() => VariavelService))
        private readonly variavelService: VariavelService
    ) {}

    async create(tipo: TipoPdm, createIndicadorDto: CreateIndicadorDto, user: PessoaFromJwt) {
        if (!createIndicadorDto.meta_id && !createIndicadorDto.iniciativa_id && !createIndicadorDto.atividade_id)
            throw new HttpException(
                'Indicador deve ter no mínimo 1 relacionamento: Meta, Iniciativa ou Atividade',
                400
            );

        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: createIndicadorDto.meta_id,
                atividade_id: createIndicadorDto.atividade_id,
                iniciativa_id: createIndicadorDto.iniciativa_id,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, metaRow.meta_id, user, 'indicador');

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
        indicador_id: number | null,
        formula?: string
    ): Promise<string> {
        let formula_compilada = '';
        const neededRefs: Record<string, number> = {};
        const neededFCs: Record<number, number> = {};
        if (formula) {
            formula_compilada = this.compilaFormula(formula);

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

            if (indicador_id) {
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
            // confere que cada @_XXX tem existe no indicador
            // quando não tem indicador, não pode usar nenhuma outra formula composta at-all, nem variavel calculada
            if (indicador_id) {
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
            } else {
                throw new HttpException(
                    `formula_variaveis| Referencia de fórmula composta @_${formulaCompostaId} enviada na formula não pode ser usada em Fórmula Composta (Plano Setorial)`,
                    400
                );
            }
        }

        // TODO adicionar limpeza de formula_variaveis que não tiveram as referencias usadas

        return formula_compilada;
    }

    compilaFormula(formula: string) {
        let formula_compilada: string;
        try {
            formula_compilada = FP.parse(formula.toLocaleUpperCase());
        } catch (error) {
            throw new HttpException(`formula| formula não foi entendida: ${formula}\n${error}`, 400);
        }
        return formula_compilada;
    }

    async findOne(tipo: TipoPdm, indicador_id: number, user: PessoaFromJwt): Promise<Indicador | null> {
        const list = await this.findAll(tipo, { id: indicador_id }, user);

        return list.length ? list[0] : null;
    }

    async findAll(tipo: TipoPdm, filters: FilterIndicadorDto, user: PessoaFromJwt): Promise<Indicador[]> {
        if (filters.id) {
            const indicadorFound = await this.prisma.indicador.findFirst({
                where: {
                    id: filters.id,
                },
                select: { meta_id: true, iniciativa_id: true, atividade_id: true },
            });
            if (!indicadorFound) throw new HttpException('Indicador não encontrado', 404);

            filters.meta_id = indicadorFound.meta_id ?? undefined;
            filters.iniciativa_id = indicadorFound.iniciativa_id ?? undefined;
            filters.atividade_id = indicadorFound.atividade_id ?? undefined;
        }

        if (!filters.meta_id && !filters.iniciativa_id && !filters.atividade_id)
            throw new HttpException(
                'Para buscar os indicadores deve ser informado no mínimo 1 relacionamento: Meta, Iniciativa ou Atividade',
                400
            );

        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: filters.meta_id,
                atividade_id: filters.atividade_id,
                iniciativa_id: filters.iniciativa_id,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, metaRow.meta_id, user, 'indicador', 'readonly');

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
                ha_avisos_data_fim: true,
                variavel_categoria_id: true,
            },
            orderBy: { criado_em: 'desc' },
        });

        return listActive;
    }

    async update(tipo: TipoPdm, id: number, dto: UpdateIndicadorDto, user: PessoaFromJwt) {
        const indicadorSelectData: Prisma.IndicadorSelect = {
            id: true,
            formula_compilada: true,
            inicio_medicao: true,
            fim_medicao: true,
            acumulado_usa_formula: true,
            periodicidade: true,
            acumulado_valor_base: true,
            atividade_id: true,
            iniciativa_id: true,
            meta_id: true,
            variavel_categoria_id: true,
            formula_variaveis: {
                select: {
                    variavel_id: true,
                    janela: true,
                    referencia: true,
                    usar_serie_acumulada: true,
                    variavel: {
                        select: {
                            variavel_categorica_id: true,
                        },
                    },
                },
            },
        };
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: id, removido_em: null },
            select: indicadorSelectData,
        });
        if (!indicador) throw new HttpException('indicador não encontrado', 400);

        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: indicador.meta_id ?? undefined,
                atividade_id: indicador.atividade_id ?? undefined,
                iniciativa_id: indicador.iniciativa_id ?? undefined,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, metaRow.meta_id, user, 'indicador');

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
                if (dto.variavel_categoria_id !== undefined) {
                    if (dto.variavel_categoria_id !== null) {
                        if (formula === undefined || Array.isArray(formula_variaveis) === false)
                            throw new HttpException(
                                'Para alterar a categoria da variável é necessário enviar a formula e as variáveis',
                                400
                            );

                        if (formula_variaveis.length > 1)
                            throw new HttpException('Apenas uma variável é permitida para a categórica', 400);
                        if (formula_variaveis[0].variavel_id !== dto.variavel_categoria_id)
                            throw new HttpException('A variável da categoria deve ser a mesma da formula', 400);
                        const referencia = formula_variaveis[0].referencia;
                        if (formula.indexOf(referencia) === -1)
                            throw new HttpException('A referência da variável da categoria deve estar na formula', 400);
                    }
                }

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
                    select: {
                        ...indicadorSelectData,
                    },
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

                    if (indicador.variavel_categoria_id == null) {
                        const indicadorAtualizado = await prismaTx.indicador.findFirstOrThrow({
                            where: { id: indicador.id },
                            select: {
                                formula_variaveis: {
                                    select: {
                                        variavel: {
                                            select: {
                                                variavel_categorica_id: true,
                                            },
                                        },
                                    },
                                },
                            },
                        });

                        if (indicadorAtualizado.formula_variaveis.some((fv) => fv.variavel.variavel_categorica_id)) {
                            throw new BadRequestException(
                                'Não é possível usar uma variável categórica em um indicador calculado.'
                            );
                        }
                    }
                }

                // independente de ter ou não formula_variaveis, revalida as regras do PS
                if (tipo === 'PS') await this.validaRegrasPS(id, prismaTx);

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

                //Tratamento para series inválidas
                if (tipo === 'PDM') {
                    const variaveis = await prismaTx.indicadorVariavel.findMany({
                        where: { indicador_id: indicador.id, indicador_origem_id: null },
                    });
                    for (const variavel of variaveis) {
                        await this.variavelService.trataPeriodosSerieVariavel(
                            prismaTx,
                            variavel.variavel_id,
                            indicador.id,
                            indicador.inicio_medicao,
                            indicador.fim_medicao
                        );
                    }
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

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        const indicador = await this.prisma.indicador.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: { meta_id: true, atividade_id: true, iniciativa_id: true },
        });
        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: indicador.meta_id ?? undefined,
                atividade_id: indicador.atividade_id ?? undefined,
                iniciativa_id: indicador.iniciativa_id ?? undefined,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, metaRow.meta_id, user, 'indicador');

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
                valor_nominal: serieValor.valor_nominal.toString(),
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
        tipo: TipoPdm,
        id: number,
        user: PessoaFromJwt,
        filters: FilterIndicadorSerieDto
    ): Promise<ListSeriesAgrupadas> {
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: +id },
            select: {
                id: true,
                inicio_medicao: true,
                fim_medicao: true,
                periodicidade: true,
                variavel_categoria_id: true,
            },
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 404);

        if (indicador.variavel_categoria_id === CONST_CRONO_VAR_CATEGORICA_ID) {
            indicador.variavel_categoria_id = null;
        }
        // caso seja variável categórica, pega a série de proxy
        if (indicador.variavel_categoria_id) {
            const proxy = await this.variavelService.getSeriePrevistoRealizado(
                tipo == 'PS' ? 'Global' : 'PDM',
                {
                    uso: 'leitura',
                    incluir_auxiliares: true,
                },
                indicador.variavel_categoria_id,
                user
            );
            return proxy;
        }

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

    async linkVariavel(id: number, dto: LinkIndicadorVariavelDto, user: PessoaFromJwt): Promise<void> {
        const indicador = await this.prisma.indicador.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                meta_id: true,
                atividade_id: true,
                iniciativa_id: true,
                inicio_medicao: true,
                fim_medicao: true,
            },
        });
        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: indicador.meta_id ?? undefined,
                atividade_id: indicador.atividade_id ?? undefined,
                iniciativa_id: indicador.iniciativa_id ?? undefined,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow('PS', metaRow.meta_id, user, 'indicador');

        const variaveisDb = await this.prisma.variavel.findMany({
            where: {
                id: { in: dto.variavel_ids },
                tipo: {
                    in: ['Calculada', 'Global'],
                },
                removido_em: null,
            },
            select: { id: true, inicio_medicao: true, fim_medicao: true, titulo: true, codigo: true },
        });
        const alreadyInIndicador = await this.prisma.indicadorVariavel.findMany({
            where: {
                variavel_id: { in: dto.variavel_ids },
                indicador_id: id,
                desativado: false,
                indicador_origem_id: null,
            },
            select: { variavel_id: true },
        });
        const alreadyLinkedIds = new Set(alreadyInIndicador.map((item) => item.variavel_id));

        for (const varId of dto.variavel_ids) {
            // pula se já tem, nem valida os dados, isso é apenas para não compilar o frontend se caso venha duplicado
            if (alreadyLinkedIds.has(varId)) continue;

            const variavel = variaveisDb.find((e) => e.id == varId);
            if (!variavel) throw new HttpException(`Variável ${varId} não encontrada`, 400);

            if (variavel.inicio_medicao == null)
                throw new HttpException(
                    `Variável ${variavel.titulo} (${variavel.codigo}) não possui data de início de medição`,
                    400
                );

            if (variavel.inicio_medicao && indicador.inicio_medicao < variavel.inicio_medicao)
                throw new HttpException(
                    `A variável ${variavel.titulo} (${variavel.codigo}) inicia a medição em ${Date2YMD.dbDateToDMY(
                        variavel.inicio_medicao
                    )}, enquanto o indicador inicia em ${Date2YMD.dbDateToDMY(indicador.inicio_medicao)}`,
                    400
                );

            if (variavel.fim_medicao && indicador.fim_medicao > variavel.fim_medicao)
                throw new HttpException(
                    `A variável ${variavel.titulo} (${variavel.codigo}) termina a medição em ${Date2YMD.dbDateToDMY(
                        variavel.fim_medicao
                    )}, enquanto o indicador termina em ${Date2YMD.dbDateToDMY(indicador.fim_medicao)}`,
                    400
                );
        }

        const variableIdsToLink = dto.variavel_ids.filter((varId) => !alreadyLinkedIds.has(varId));
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<void> => {
            await prisma.indicadorVariavel.createMany({
                data: variableIdsToLink.map(
                    (varId) =>
                        ({
                            variavel_id: varId,
                            indicador_id: id,
                            desativado: false,
                            indicador_origem_id: null,
                            aviso_data_fim: false,
                        }) satisfies Prisma.IndicadorVariavelCreateManyInput
                ),
            });
        });

        return;
    }

    async unlinkVariavel(id: number, dto: UnlinkIndicadorVariavelDto, user: PessoaFromJwt): Promise<void> {
        const indicador = await this.prisma.indicador.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                meta_id: true,
                atividade_id: true,
                iniciativa_id: true,
                inicio_medicao: true,
                fim_medicao: true,
            },
        });
        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: indicador.meta_id ?? undefined,
                atividade_id: indicador.atividade_id ?? undefined,
                iniciativa_id: indicador.iniciativa_id ?? undefined,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow('PS', metaRow.meta_id, user, 'indicador');

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
            const emUso = await prismaTx.indicadorFormulaVariavel.count({
                where: {
                    variavel_id: dto.variavel_id,
                    indicador_id: id,
                },
            });
            if (emUso > 0) {
                throw new HttpException(
                    `A variável ${dto.variavel_id} está sendo usada em fórmulas do indicador ${id}`,
                    400
                );
            }

            await prismaTx.indicadorVariavel.deleteMany({
                where: {
                    variavel_id: dto.variavel_id,
                    indicador_id: id,
                    desativado: false,
                    indicador_origem_id: null,
                },
            });
        });

        return;
    }

    private async validaRegrasPS(indicadorId: number, prismaTx: Prisma.TransactionClient) {
        const indicador = await prismaTx.indicador.findUniqueOrThrow({
            where: { id: indicadorId },
            include: {
                IndicadorVariavel: {
                    include: {
                        variavel: {
                            select: {
                                id: true,
                                codigo: true,
                                inicio_medicao: true,
                                fim_medicao: true,
                            },
                        },
                    },
                },
                formula_variaveis: {
                    select: {
                        variavel: {
                            select: {
                                id: true,
                                codigo: true,
                                periodicidade: true,
                                inicio_medicao: true,
                                fim_medicao: true,
                                regiao_id: true,
                            },
                        },
                    },
                },
            },
        });
        const indicadorPeriodicidade = this.periodicidade2mes(indicador.periodicidade);

        // se tem formula, valida as regras
        if (indicador.formula_compilada?.trim()) {
            const temPeriodoValido = indicador.formula_variaveis.some(
                (iv) => this.periodicidade2mes(iv.variavel.periodicidade) <= indicadorPeriodicidade
            );
            if (!temPeriodoValido) {
                throw new HttpException(
                    'A fórmula do indicador deve ter ao menos 1 variável com periodicidade menor ou igual à periodicidade do indicador',
                    400
                );
            }

            if (indicador.regionalizavel) {
                // aqui n importa o nivel, só se tem ou não
                const temVariavelComRegiao = indicador.formula_variaveis.some((iv) => iv.variavel.regiao_id !== null);
                if (!temVariavelComRegiao) {
                    throw new HttpException(
                        'A fórmula de indicador regionalizado deve ter ao menos 1 variável regionalizada',
                        400
                    );
                }
            }
        }

        // validar se é pra manter com a fazer parte das variaveis da formula ou não
        for (const iv of indicador.IndicadorVariavel) {
            // na teoria todas as variaveis tem inicio_medicao quando Global/Calculada, mas just in case
            if (iv.variavel.inicio_medicao) {
                if (
                    iv.variavel.inicio_medicao > indicador.inicio_medicao ||
                    (iv.variavel.fim_medicao && iv.variavel.fim_medicao < indicador.fim_medicao)
                ) {
                    throw new HttpException(
                        `A variável ${iv.variavel.codigo} não cobre o período de medição do indicador. Requerido: ${Date2YMD.dbDateToDMY(
                            indicador.inicio_medicao
                        )} a ${Date2YMD.dbDateToDMY(indicador.fim_medicao)}, Variável: ${Date2YMD.dbDateToDMY(
                            iv.variavel.inicio_medicao ?? '-'
                        )} a ${Date2YMD.dbDateToDMY(iv.variavel.fim_medicao) ?? '-'}`,
                        400
                    );
                }
            }
        }
    }

    private periodicidade2mes(periodicidade: Periodicidade): number {
        // hardcoded pra n chamar o postgres
        const periodicidadeMap: Record<Periodicidade, number> = {
            Mensal: 1,
            Bimestral: 2,
            Trimestral: 3,
            Quadrimestral: 4,
            Semestral: 6,
            Anual: 12,
            Quinquenal: 60,
            Secular: 1200,
        };
        return periodicidadeMap[periodicidade];
    }
}
