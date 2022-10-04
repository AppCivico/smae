import { HttpException, Injectable } from '@nestjs/common';
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

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let responsaveis = createVariavelDto.responsaveis!;
            delete createVariavelDto.responsaveis;

            let indicador_id = createVariavelDto.indicador_id!;
            delete createVariavelDto.indicador_id;

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

            await prisma.variavelResponsavel.createMany({
                data: await this.buildVarResponsaveis(variavel.id, responsaveis),
            });

            return variavel;
        });

        return { id: created.id };
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
                        indicador: {
                            desativado: removidoStatus,
                            meta_id: filters?.meta_id
                        }
                    }
                }
            }
        } else if (filters?.iniciativa_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        indicador: {
                            desativado: removidoStatus,
                            iniciativa_id: filters?.iniciativa_id,

                            iniciativa: {
                                compoe_indicador_meta: true,
                                atividade: {
                                    some: {
                                        compoe_indicador_iniciativa: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else if (filters?.atividade_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        indicador: {
                            desativado: removidoStatus,
                            atividade_id: filters?.atividade_id,

                            atividade: {
                                compoe_indicador_iniciativa: true,

                                iniciativa: {
                                    compoe_indicador_meta: true
                                }
                            }
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
                        indicador: {
                            select: {
                                id: true,
                                titulo: true,
                                meta_id: true,
                                iniciativa_id: true,
                                atividade_id: true,

                                iniciativa: {
                                    select: {
                                        id: true,
                                        meta_id: true,
                                        titulo: true,
                                        codigo: true
                                    }
                                },

                                atividade: {
                                    select: {
                                        id: true,
                                        iniciativa_id: true,
                                        titulo: true,
                                        codigo: true
                                    }
                                }
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

            return {
                ...row,
                responsaveis: responsaveis
            }
        })

        return ret;
    }


    async update(variavelId: number, updateVariavelDto: UpdateVariavelDto, user: PessoaFromJwt) {

        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            let responsaveis = updateVariavelDto.responsaveis!;
            delete updateVariavelDto.responsaveis;

            await prisma.variavel.updateMany({
                where: { id: variavelId },
                data: {
                    ...updateVariavelDto,
                }
            });

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

    async getSeriePrevisto(variavelId: number) {
        const indicador = await this.getIndicadorViaVariavel(variavelId);
        const indicadorVariavelRelList = indicador.IndicadorVariavel.filter((v) => {
            return v.variavel.id === variavelId
        });
        const variavel = indicadorVariavelRelList[0].variavel

        const valoresExistentes = await this.getValorSerieExistente(variavelId, ['Previsto', 'PrevistoAcumulado']);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes);

        const result: ListPrevistoAgrupadas = {
            variavel: {
                id: variavelId,
                casas_decimais: variavel.casas_decimais,
                periodicidade: variavel.periodicidade,
            },
            previsto: [],
            ordem_series: ['Previsto', 'PrevistoAcumulado']
        };

        const todosPeriodos = await this.gerarPeriodosEntreDatas(indicador.inicio_medicao, indicador.fim_medicao, variavel.periodicidade)
        for (const periodoYMD of todosPeriodos) {
            const seriesExistentes: SerieValorNomimal[] = [];

            const existeValor = porPeriodo[periodoYMD];
            if (existeValor && (existeValor.Previsto || existeValor.PrevistoAcumulado)) {
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
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
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
