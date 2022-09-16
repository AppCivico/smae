import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Periodicidade, Prisma, Serie } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from 'src/common/date2ymd';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SerieUpsert } from 'src/variavel/dto/batch-serie-upsert.dto';
import { FilterVariavelDto } from 'src/variavel/dto/filter-variavel.dto';
import { ListPrevistoAgrupadas } from 'src/variavel/dto/list-variavel.dto';
import { SerieValorNomimal, SerieValorPorPeriodo } from 'src/variavel/entities/variavel.entity';
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
                            },
                        }
                    }
                },
            }
        });


        return listActive;
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

    async getSeriePrevisto(variavelId: number) {
        const indicador = await this.prisma.indicador.findFirst({
            where: {
                IndicadorVariavel: {
                    some: {
                        variavel_id: variavelId
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

        const variavel = indicador.IndicadorVariavel[0].variavel;

        const currentValues = await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id: variavelId,
                serie: {
                    in: ['Previsto', 'PrevistoAcumulado'],
                }
            },
            select: {
                valor_nominal: true,
                id: true,
                data_valor: true,
                serie: true,
            }
        });

        const porPeriodo: SerieValorPorPeriodo = new SerieValorPorPeriodo();
        for (const serieValor of currentValues) {
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
                valor_nomimal: serieValor.valor_nominal,
                referencia: this.getEditExistingSerieJwt(serieValor.id),
            }
        }


        const result: ListPrevistoAgrupadas = {
            variavel: {
                id: variavelId,
                casas_decimais: variavel.casas_decimais,
                periodicidade: variavel.periodicidade,
            },
            previsto: [],
        };

        const todosPeriodos = await this.geraPeriodo(indicador.inicio_medicao, indicador.fim_medicao, variavel.periodicidade)
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
                periodo: periodoYMD,
                // TODO: botar o label de acordo com a periodicidade"
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
            })

        }

        return result;
    }

    buildNonExistingSerieValor(periodo: string, variavelId: number, serie: Serie): SerieValorNomimal {
        return {
            data_valor: periodo,
            referencia: this.getEditNotExistingSerieJwt(variavelId, periodo, serie),
            valor_nomimal: null
        }
    }


    getEditExistingSerieJwt(id: number): string {
        return this.jwtService.sign({
            id: id,
        });
    }

    getEditNotExistingSerieJwt(variavelId: number, period: DateYMD, serie: Serie): string {
        return this.jwtService.sign({
            p: period,
            v: variavelId,
            s: serie
        });
    }

    async geraPeriodo(start: Date, end: Date, periodicidade: Periodicidade): Promise<DateYMD[]> {

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

    async batchUpsertSerie(valores: SerieUpsert[], user: PessoaFromJwt) {

        throw new Error('Method not implemented.');
    }


}
