import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Periodicidade, Prisma, Serie } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import { triggerAsyncId } from 'async_hooks';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from 'src/common/date2ymd';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExistingSerieJwt, NonExistingSerieJwt, SerieJwt, SerieUpsert, ValidatedUpsert } from 'src/variavel/dto/batch-serie-upsert.dto';
import { FilterVariavelDto } from 'src/variavel/dto/filter-variavel.dto';
import { ListPrevistoAgrupadas } from 'src/variavel/dto/list-variavel.dto';
import { IdNomeExibicao, SerieValorNomimal, SerieValorPorPeriodo, ValorSerieExistente, Variavel } from 'src/variavel/entities/variavel.entity';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';

const JWT_AUD = 'VS';

@Injectable()
export class VariavelService {
    private readonly logger = new Logger(VariavelService.name);
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async buildVarResponsaveis(variableId: number, responsaveis: number[]): Promise<Prisma.VariavelResponsavelCreateManyInput[]> {
        const arr: Prisma.VariavelResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                variavel_id: variableId,
                pessoa_id: pessoaId
            });
        }
        return arr;
    }

    async create(createVariavelDto: CreateVariavelDto, user: PessoaFromJwt) {
        // TODO: verificar se o indicador existe e esta ativo
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id
        // TODO: verificar se o createVariavelDto.periodicidade é a mesma do indicador (por enquanto)
        // TODO: verificar se veio região:
        // se a região existe e está ativa, se é do mesmo nível que foi escolhido no indicador
        // se não vier, conferir se o indicador realmente não é por região

        let responsaveis = createVariavelDto.responsaveis!;
        delete createVariavelDto.responsaveis;

        let indicador_id = createVariavelDto.indicador_id!;
        delete createVariavelDto.indicador_id;

        const indicador = await this.prisma.indicador.findFirst({
            where: { id: indicador_id },
            select: {
                id: true,
                iniciativa_id: true,
                atividade_id: true,
                meta_id: true,
            }
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 400);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const variavel = await prisma.variavel.create({
                data: {
                    ...createVariavelDto,
                    indicador_variavel: {
                        create: {
                            indicador_id: indicador_id,
                        }
                    }
                },
                select: { id: true }
            });

            await this.recalcIndicadorVariavel(indicador, variavel.id, prisma);

            await prisma.variavelResponsavel.createMany({
                data: await this.buildVarResponsaveis(variavel.id, responsaveis),
            });

            return variavel;
        });

        return { id: created.id };
    }

    async recalcIndicadorVariavel(
        indicador: {
            id: number;
            iniciativa_id: number | null;
            atividade_id: number | null;
            meta_id: number | null;
        }, variavel_id: number, prisma: Prisma.TransactionClient) {

        await prisma.indicadorVariavel.deleteMany({
            where: {
                variavel_id: variavel_id,
                NOT: { indicador_origem_id: null }
            }
        });

        this.logger.log(`recalcIndicadorVariavel: variavel ${variavel_id}, indicador: ${JSON.stringify(indicador)}`);

        // se o indicador é uma atividade, precisamos testar se essa atividade tem herança para a
        // iniciativa
        if (indicador.atividade_id) {
            const atividade = await prisma.atividade.findFirstOrThrow({
                where: {
                    id: indicador.atividade_id
                },
                select: {
                    compoe_indicador_iniciativa: true,
                    iniciativa: {
                        select: {
                            compoe_indicador_meta: true,
                            meta_id: true,
                            Indicador: {
                                where: {
                                    removido_em: null,
                                },
                                select: {
                                    id: true
                                }
                            }
                        }
                    }
                }
            });
            this.logger.log(`recalcIndicadorVariavel: atividade encontrada ${JSON.stringify(atividade)}`);
            if (atividade.compoe_indicador_iniciativa) {
                const indicadorDaIniciativa = atividade.iniciativa.Indicador[0];

                if (!indicadorDaIniciativa) {
                    this.logger.warn(`recalcIndicadorVariavel: Atividade ID=${indicador.atividade_id} compoe_indicador_iniciativa mas não tem indicador ativo`);
                } else {
                    const data = {
                        indicador_id: indicadorDaIniciativa.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id
                    };
                    this.logger.log(`recalcIndicadorVariavel: criando ${data}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }

                // atividade tbm compoe a meta, então precisa levar essa variavel para lá também
                // 'recursão' manual
                if (atividade.iniciativa.compoe_indicador_meta) {
                    this.logger.log(`recalcIndicadorVariavel: iniciativa da atividade compoe_indicador_meta, buscando indicador da meta`);
                    const indicadorDaMeta = await this.prisma.indicador.findFirst({
                        where: {
                            removido_em: null,
                            meta_id: atividade.iniciativa.meta_id
                        },
                        select: {
                            id: true
                        }
                    });
                    if (!indicadorDaMeta) {
                        this.logger.warn(`recalcIndicadorVariavel: indicador da meta ${atividade.iniciativa.meta_id} não foi encontrado!`);
                    } else {
                        const data = {
                            indicador_id: indicadorDaMeta.id,
                            variavel_id: variavel_id,
                            indicador_origem_id: indicadorDaIniciativa.id
                        };
                        this.logger.log(`recalcIndicadorVariavel: criando ${data}`);
                        await prisma.indicadorVariavel.create({
                            data: data
                        });
                    }
                }
            }
        } else if (indicador.iniciativa_id) {
            // praticamente a mesma coisa, porém começa já na iniciativa
            const iniciativa = await prisma.iniciativa.findFirstOrThrow({
                where: {
                    id: indicador.iniciativa_id
                },
                select: {
                    compoe_indicador_meta: true,
                    meta_id: true,
                    Indicador: {
                        where: {
                            removido_em: null,
                        },
                        select: {
                            id: true
                        }
                    }
                }
            });
            this.logger.log(`recalcIndicadorVariavel: iniciativa encontrada ${JSON.stringify(iniciativa)}`);

            if (iniciativa.compoe_indicador_meta) {
                const indicadorDaIniciativa = iniciativa.Indicador[0];

                if (!indicadorDaIniciativa) {
                    this.logger.warn(`recalcIndicadorVariavel: Iniciativa ${indicador.iniciativa_id} compoe_indicador_meta mas não tem indicador ativo`);
                } else {
                    const data = {
                        indicador_id: indicadorDaIniciativa.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id
                    };
                    this.logger.log(`recalcIndicadorVariavel: criando ${data}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }
            }
        }
    }

    async findAll(filters: FilterVariavelDto | undefined = undefined) {
        let filterQuery: any = {};

        let removidoStatus = filters?.remover_desativados == true ? false : undefined;

        if (filters?.indicador_id && filters?.meta_id) {
            throw new HttpException('Apenas filtrar por meta_id ou indicador_id por vez', 400);
        }

        if (filters?.indicador_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador_id: filters?.indicador_id
                    }
                }
            };
        } else if (filters?.meta_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador: {
                            meta_id: filters?.meta_id
                        }
                    }
                }
            }
        } else if (filters?.iniciativa_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador: {
                            iniciativa_id: filters?.iniciativa_id
                        }
                    }
                }
                // Comentado pq automaticamente quando a compoe_indicador_iniciativa já
                // vai existir um relacionamento na indicador_variavel com o indicador da iniciativa
                //~                    {
                //~                        indicador_variavel: {
                //~                            some: {
                //~                                desativado: removidoStatus,
                //~                                indicador: {
                //~                                    atividade: {
                //~                                        compoe_indicador_iniciativa: true,
                //~                                        iniciativa_id: filters?.iniciativa_id
                //~                                    }
                //~                                }
                //~                            }
                //~                        }
                //~                    },

            }
        } else if (filters?.atividade_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador: {
                            atividade_id: filters?.atividade_id
                        }
                    }
                }
            }
        }

        let listActive = await this.prisma.variavel.findMany({
            where: {
                ...filterQuery,
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                acumulativa: true,
                casas_decimais: true,
                unidade_medida: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    }
                },
                ano_base: true,
                valor_base: true,
                periodicidade: true,
                peso: true,
                orgao: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    }
                },
                regiao: {
                    select: {
                        id: true,
                        nivel: true,
                        descricao: true,
                        parente_id: true,
                        codigo: true,
                    }
                },
                indicador_variavel: {
                    select: {
                        desativado: true,
                        id: true,
                        indicador_origem: {
                            select: {
                                id: true,
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                }
                            }
                        },
                        indicador: {
                            select: {
                                id: true,
                                titulo: true,
                                meta_id: true,
                                iniciativa_id: true,
                                atividade_id: true,
                            },
                        },
                    }
                },
                variavel_responsavel: {
                    select: {
                        pessoa: { select: { id: true, nome_exibicao: true } }
                    }
                }
            }
        });

        const ret = listActive.map(row => {
            const responsaveis = row.variavel_responsavel.map(responsavel => {
                return {
                    id: responsavel.pessoa.id,
                    nome_exibicao: responsavel.pessoa.nome_exibicao
                }
            });

            let indicador_variavel: typeof row.indicador_variavel = [];
            // filtra as variaveis novamente caso tiver filtros por indicador ou atividade
            if (filters?.indicador_id || filters?.iniciativa_id || filters?.atividade_id) {

                for (const iv of row.indicador_variavel) {
                    if (filters?.atividade_id && filters?.atividade_id === iv.indicador.atividade_id) {
                        indicador_variavel.push(iv)
                    } else if (filters?.indicador_id && filters?.indicador_id === iv.indicador.id) {
                        indicador_variavel.push(iv)
                    } else if (filters?.iniciativa_id && filters?.iniciativa_id === iv.indicador.iniciativa_id) {
                        indicador_variavel.push(iv)
                    }
                }
            } else {
                indicador_variavel = row.indicador_variavel;
            }

            return {
                ...row,
                variavel_responsavel: undefined,
                indicador_variavel: indicador_variavel,
                responsaveis: responsaveis
            }
        })

        return ret;
    }


    async update(variavelId: number, updateVariavelDto: UpdateVariavelDto, user: PessoaFromJwt) {

        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id

        // buscando apenas pelo indicador pai verdadeiro desta variavel
        const selfIdicadorVariavel = await this.prisma.indicadorVariavel.findFirst({
            where: { variavel_id: variavelId, indicador_origem_id: null },
            select: { indicador_id: true }
        });
        if (!selfIdicadorVariavel) throw new HttpException('Variavel não encontrada', 400);

        // e com o indicador verdadeiro, temos os dados para recalcular os niveis
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: selfIdicadorVariavel.indicador_id },
            select: {
                id: true,
                iniciativa_id: true,
                atividade_id: true,
                meta_id: true,
            }
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 400);


        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            let responsaveis = updateVariavelDto.responsaveis!;
            delete updateVariavelDto.responsaveis;

            await prisma.variavel.updateMany({
                where: { id: variavelId },
                data: {
                    ...updateVariavelDto,
                }
            });

            await this.recalcIndicadorVariavel(indicador, variavelId, prisma);

            await prisma.variavelResponsavel.deleteMany({
                where: { variavel_id: variavelId }
            })

            await prisma.variavelResponsavel.createMany({
                data: await this.buildVarResponsaveis(variavelId, responsaveis),
            });
        });

        return { id: variavelId };
    }

    async getIndicadorViaVariavel(variavel_id: number) {
        const indicador = await this.prisma.indicador.findFirst({
            where: {
                IndicadorVariavel: {
                    some: {
                        variavel_id: variavel_id
                    }
                },
            },
            select: {
                inicio_medicao: true,
                fim_medicao: true,
                IndicadorVariavel: {
                    select: {
                        variavel: {
                            select: {
                                id: true,
                                casas_decimais: true,
                                periodicidade: true
                            }
                        }
                    }
                }
            }
        });
        if (!indicador)
            throw new HttpException('Indicador ou variavel não encontrada', 404);
        return indicador
    }


    async getValorSerieExistente(variavelId: number, series: Serie[]): Promise<ValorSerieExistente[]> {
        return await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id: variavelId,
                serie: {
                    in: series,
                }
            },
            select: {
                valor_nominal: true,
                id: true,
                data_valor: true,
                serie: true,
            }
        });
    }


    getValorSerieExistentePorPeriodo(valoresExistentes: ValorSerieExistente[]): SerieValorPorPeriodo {
        const porPeriodo: SerieValorPorPeriodo = new SerieValorPorPeriodo();
        for (const serieValor of valoresExistentes) {
            if (!porPeriodo[Date2YMD.toString(serieValor.data_valor)]) {
                porPeriodo[Date2YMD.toString(serieValor.data_valor)] = {
                    Previsto: undefined,
                    PrevistoAcumulado: undefined,
                    Realizado: undefined,
                    RealizadoAcumulado: undefined,
                };
            }

            console.log(serieValor.valor_nominal);
            console.log({
                valueOf: serieValor.valor_nominal.valueOf(),
                toString: serieValor.valor_nominal.toString(),
                toDecimalPlaces: serieValor.valor_nominal.toDecimalPlaces(),
                toDecimalPlaces99: serieValor.valor_nominal.toDecimalPlaces(99),
                decimalPlaces: serieValor.valor_nominal.decimalPlaces(),
                precision: serieValor.valor_nominal.precision(),
            });
            porPeriodo[Date2YMD.toString(serieValor.data_valor)][serieValor.serie] = {
                data_valor: Date2YMD.toString(serieValor.data_valor),
                valor_nominal: serieValor.valor_nominal.toPrecision(),
                referencia: this.getEditExistingSerieJwt(serieValor.id),
            }
        }

        return porPeriodo;
    }

    async getSeriePrevistoRealizado(variavelId: number) {
        const indicador = await this.getIndicadorViaVariavel(variavelId);
        const indicadorVariavelRelList = indicador.IndicadorVariavel.filter((v) => {
            return v.variavel.id === variavelId
        });
        const variavel = indicadorVariavelRelList[0].variavel

        const valoresExistentes = await this.getValorSerieExistente(variavelId, ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado']);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes);

        const result: ListPrevistoAgrupadas = {
            variavel: {
                id: variavelId,
                casas_decimais: variavel.casas_decimais,
                periodicidade: variavel.periodicidade,
            },
            previsto: [],
            ordem_series: ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado']
        };

        const todosPeriodos = await this.gerarPeriodosEntreDatas(indicador.inicio_medicao, indicador.fim_medicao, variavel.periodicidade)
        for (const periodoYMD of todosPeriodos) {
            const seriesExistentes: SerieValorNomimal[] = [];

            const existeValor = porPeriodo[periodoYMD];
            if (existeValor && (
                existeValor.Previsto
                || existeValor.PrevistoAcumulado
                || existeValor.Realizado
                || existeValor.RealizadoAcumulado
            )) {
                if (existeValor.Previsto) {
                    seriesExistentes.push(existeValor.Previsto);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                }

                if (existeValor.PrevistoAcumulado) {
                    seriesExistentes.push(existeValor.PrevistoAcumulado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
                }

                if (existeValor.Realizado) {
                    seriesExistentes.push(existeValor.Realizado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
                }

                if (existeValor.RealizadoAcumulado) {
                    seriesExistentes.push(existeValor.RealizadoAcumulado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado'));
                }
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado'));
            }

            result.previsto.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                // TODO: botar o label de acordo com a periodicidade"
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
            })

        }

        return result;
    }

    buildNonExistingSerieValor(periodo: DateYMD, variavelId: number, serie: Serie): SerieValorNomimal {
        return {
            data_valor: periodo,
            referencia: this.getEditNonExistingSerieJwt(variavelId, periodo, serie),
            valor_nominal: ''
        }
    }


    getEditExistingSerieJwt(id: number): string {
        // TODO opcionalmente adicionar o modificado_em aqui
        return this.jwtService.sign({
            id: id,
        } as ExistingSerieJwt);
    }

    getEditNonExistingSerieJwt(variavelId: number, period: DateYMD, serie: Serie): string {
        return this.jwtService.sign({
            p: period,
            v: variavelId,
            s: serie
        } as NonExistingSerieJwt);
    }

    async gerarPeriodosEntreDatas(start: Date, end: Date, periodicidade: Periodicidade): Promise<DateYMD[]> {

        const [startStr, endStr] = [Date2YMD.toString(start), Date2YMD.toString(end)];
        const periodPg: Record<Periodicidade, string> = {
            Diario: '1 day',
            Semanal: '1 week',
            Mensal: '1 month',
            Bimestral: '2 months',
            Trimestral: '3 months',
            Quadrimestral: '4 months',
            Semestral: '6 months',
            Anual: '1 year',
            Quinquenal: '5 years',
            Secular: '10 years'
        };

        const dados: Record<string, string>[] = await this.prisma.$queryRaw`
            select to_char(p.p, 'yyyy-mm-dd') as dt
            from generate_series(${startStr}::date, ${endStr}::date, ${periodPg[periodicidade]}::interval) p
        `;

        return dados.map((e) => e.dt);
    }

    validarValoresJwt(valores: SerieUpsert[]): ValidatedUpsert[] {
        const valids: ValidatedUpsert[] = [];
        console.log({ log: 'validation', valores })
        for (const valor of valores) {
            let referenciaDecoded: SerieJwt | null = null;
            try {
                referenciaDecoded = this.jwtService.decode(valor.referencia) as SerieJwt;
            } catch (error) {
                console.log(error)
            }
            if (!referenciaDecoded)
                throw new HttpException('Tempo para edição dos valores já expirou. Abra em uma nova aba e faça o preenchimento novamente.', 400);

            valids.push({ valor: valor.valor, referencia: referenciaDecoded });
        }
        console.log({ log: 'validation', valids })
        return valids;
    }

    async batchUpsertSerie(valores: SerieUpsert[], user: PessoaFromJwt) {
        // TODO opcionalmente verificar se o modificado_em de todas as variaveis ainda é igual
        // em relação ao momento JWT foi assinado, pra evitar sobresecrita da informação sem aviso para o usuário
        // da mesma forma, ao buscar os que não tem ID, não deve existir outro valor já existente no periodo

        const valoresValidos = this.validarValoresJwt(valores);

        await this.prisma.$transaction(async (primaTnx: Prisma.TransactionClient) => {

            const idsToBeRemoved: number[] = [];
            const updatePromises: Promise<any>[] = [];
            const createList: Prisma.SerieVariavelUncheckedCreateInput[] = [];
            let anySerieIsToBeCreatedOnVariable: number | undefined;

            for (const valor of valoresValidos) {
                // busca os valores vazios mas que já existem, para serem removidos
                if (valor.valor === '' && "id" in valor.referencia) {
                    idsToBeRemoved.push(valor.referencia.id)
                } else if (valor.valor) {

                    if ("id" in valor.referencia) {
                        updatePromises.push(primaTnx.serieVariavel.updateMany({
                            where: { id: valor.referencia.id },
                            data: {
                                valor_nominal: valor.valor,
                                atualizado_em: new Date(Date.now()),
                                atualizado_por: user.id,
                            }
                        }));
                    } else {
                        if (!anySerieIsToBeCreatedOnVariable)
                            anySerieIsToBeCreatedOnVariable = valor.referencia.v;
                        createList.push({
                            valor_nominal: valor.valor,
                            variavel_id: valor.referencia.v,
                            serie: valor.referencia.s,
                            data_valor: Date2YMD.fromString(valor.referencia.p)
                        });
                    }

                }// else "não há valor" e não tem ID, ou seja, n precisa acontecer nada no banco

            }
            console.log({ idsToBeRemoved, anySerieIsToBeCreatedOnVariable, updatePromises, createList })
            // apenas um select pra forçar o banco fazer o serialize na variavel
            // ja que o prisma não suporta 'select for update'
            if (anySerieIsToBeCreatedOnVariable)
                await primaTnx.variavel.findFirst({ where: { id: anySerieIsToBeCreatedOnVariable }, select: { id: true } });

            if (updatePromises.length)
                await Promise.all(updatePromises);

            // TODO: maybe pode verificar aqui o resultado e fazer o excpetion caso tenha removido alguma
            if (createList.length)
                await primaTnx.serieVariavel.deleteMany({
                    where: {
                        'OR': createList.map((e) => {
                            return {
                                data_valor: e.data_valor,
                                variavel_id: e.variavel_id,
                                serie: e.serie,
                            }
                        })
                    }
                });

            // ja este delete é esperado caso tenha valores pra ser removidos
            if (idsToBeRemoved.length)
                await this.prisma.serieVariavel.deleteMany({
                    where: {
                        'id': { 'in': idsToBeRemoved }
                    }
                });

            if (createList.length)
                await this.prisma.serieVariavel.createMany({
                    data: createList
                });

        }, {
            isolationLevel: 'Serializable',
            maxWait: 15000,
            timeout: 25000,
        });

    }


}
