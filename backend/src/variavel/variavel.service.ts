import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Serie } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from '../common/date2ymd';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ExistingSerieJwt, NonExistingSerieJwt, SerieJwt, SerieUpsert, ValidatedUpsert } from './dto/batch-serie-upsert.dto';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { FilterVariavelDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas } from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import { SerieValorNomimal, SerieValorPorPeriodo, ValorSerieExistente } from './entities/variavel.entity';

const InicioFimErrMsg = 'Inicio/Fim da medição da variável não pode ser nulo quando a periodicidade da variável é diferente do indicador';

@Injectable()
export class VariavelService {
    private readonly logger = new Logger(VariavelService.name);
    constructor(private readonly jwtService: JwtService, private readonly prisma: PrismaService) {}

    async buildVarResponsaveis(variableId: number, responsaveis: number[]): Promise<Prisma.VariavelResponsavelCreateManyInput[]> {
        const arr: Prisma.VariavelResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                variavel_id: variableId,
                pessoa_id: pessoaId,
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

        const meta_id = await this.getMetaIdDoIndicador(createVariavelDto.indicador_id!, this.prisma);
        if (!user.hasSomeRoles(['CadastroIndicador.inserir', 'PDM.admin_cp'])) {
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(meta_id) === false) throw new HttpException('Sem permissão para criar variável nesta meta', 400);
        }

        const responsaveis = createVariavelDto.responsaveis!;
        const indicador_id = createVariavelDto.indicador_id!;
        delete createVariavelDto.responsaveis;
        delete createVariavelDto.indicador_id;

        if (createVariavelDto.atraso_meses === undefined) createVariavelDto.atraso_meses = 1;

        const indicador = await this.prisma.indicador.findFirst({
            where: { id: indicador_id },
            select: {
                id: true,
                iniciativa_id: true,
                atividade_id: true,
                meta_id: true,
                periodicidade: true,
            },
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 400);

        if (createVariavelDto.periodicidade === indicador.periodicidade) {
            createVariavelDto.fim_medicao = null;
            createVariavelDto.inicio_medicao = null;
        } else {
            ['inicio_medicao', 'fim_medicao'].forEach((e: 'inicio_medicao' | 'fim_medicao') => {
                if (!createVariavelDto[e]) {
                    throw new HttpException(`${e}| ${InicioFimErrMsg}`, 400);
                }
            });
        }

        const created = await this.prisma.$transaction(async (prismaThx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const variavel = await prismaThx.variavel.create({
                data: {
                    ...createVariavelDto,
                    indicador_variavel: {
                        create: {
                            indicador_id: indicador_id,
                        },
                    },
                },
                select: { id: true },
            });

            await this.resyncIndicadorVariavel(indicador, variavel.id, prismaThx);

            await prismaThx.variavelResponsavel.createMany({
                data: await this.buildVarResponsaveis(variavel.id, responsaveis),
            });

            await this.recalc_variaveis_acumulada([variavel.id], prismaThx);

            return variavel;
        });

        return { id: created.id };
    }

    async resyncIndicadorVariavel(
        indicador: {
            id: number;
            iniciativa_id: number | null;
            atividade_id: number | null;
            meta_id: number | null;
        },
        variavel_id: number,
        prisma: Prisma.TransactionClient,
    ) {
        await prisma.indicadorVariavel.deleteMany({
            where: {
                variavel_id: variavel_id,
                NOT: { indicador_origem_id: null },
            },
        });

        this.logger.log(`resyncIndicadorVariavel: variavel ${variavel_id}, indicador: ${JSON.stringify(indicador)}`);

        // se o indicador é uma atividade, precisamos testar se essa atividade tem herança para a
        // iniciativa
        if (indicador.atividade_id) {
            const atividade = await prisma.atividade.findFirstOrThrow({
                where: {
                    id: indicador.atividade_id,
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
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            this.logger.log(`resyncIndicadorVariavel: atividade encontrada ${JSON.stringify(atividade)}`);
            if (atividade.compoe_indicador_iniciativa) {
                const indicadorDaIniciativa = atividade.iniciativa.Indicador[0];

                if (!indicadorDaIniciativa) {
                    this.logger.warn(`resyncIndicadorVariavel: Atividade ID=${indicador.atividade_id} compoe_indicador_iniciativa mas não tem indicador ativo`);
                } else {
                    const data = {
                        indicador_id: indicadorDaIniciativa.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }

                // atividade tbm compoe a meta, então precisa levar essa variavel para lá também
                // 'recursão' manual
                if (atividade.iniciativa.compoe_indicador_meta) {
                    this.logger.log(`resyncIndicadorVariavel: iniciativa da atividade compoe_indicador_meta, buscando indicador da meta`);
                    const indicadorDaMeta = await this.prisma.indicador.findFirst({
                        where: {
                            removido_em: null,
                            meta_id: atividade.iniciativa.meta_id,
                        },
                        select: {
                            id: true,
                        },
                    });
                    if (!indicadorDaMeta) {
                        this.logger.warn(`resyncIndicadorVariavel: indicador da meta ${atividade.iniciativa.meta_id} não foi encontrado!`);
                    } else {
                        const data = {
                            indicador_id: indicadorDaMeta.id,
                            variavel_id: variavel_id,
                            indicador_origem_id: indicadorDaIniciativa.id,
                        };
                        this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                        await prisma.indicadorVariavel.create({
                            data: data,
                        });
                    }
                }
            }
        } else if (indicador.iniciativa_id) {
            // praticamente a mesma coisa, porém começa já na iniciativa
            const iniciativa = await prisma.iniciativa.findFirstOrThrow({
                where: {
                    id: indicador.iniciativa_id,
                },
                select: {
                    compoe_indicador_meta: true,
                    meta: {
                        select: {
                            id: true,
                            indicador: {
                                where: {
                                    removido_em: null,
                                },
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            this.logger.log(`resyncIndicadorVariavel: iniciativa encontrada ${JSON.stringify(iniciativa)}`);

            if (iniciativa.compoe_indicador_meta) {
                const indicadorDaMeta = iniciativa.meta.indicador[0];

                if (!indicadorDaMeta) {
                    this.logger.warn(`resyncIndicadorVariavel: Iniciativa ${indicador.iniciativa_id} compoe_indicador_meta mas não tem indicador ativo na meta`);
                } else {
                    const data = {
                        indicador_id: indicadorDaMeta.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }
            }
        }
    }

    async findAll(filters: FilterVariavelDto | undefined = undefined) {
        let filterQuery: any = {};

        const removidoStatus = filters?.remover_desativados == true ? false : undefined;

        // TODO alterar pra testar todos os casos de exclusividade
        if (filters?.indicador_id && filters?.meta_id) {
            throw new HttpException('Apenas filtrar por meta_id ou indicador_id por vez', 400);
        }

        // TODO seria bom verificar permissões do usuário, se realmente poderia visualizar [logo fazer batch edit dos valores] de todas as variaveis
        // do indicados, puxando as metas
        // atualmente o filtro ta só no frontend, pq o usuário não chegaria nesse endpoint sem usar o filtro de ID,
        // e o endpoint de metas já aplica o filtro
        // já que nessa listagem é retornado o token usado no batch

        if (filters?.indicador_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador_id: filters?.indicador_id,
                    },
                },
            };
        } else if (filters?.meta_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador: {
                            meta_id: filters?.meta_id,
                        },
                    },
                },
            };
        } else if (filters?.iniciativa_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador: {
                            iniciativa_id: filters?.iniciativa_id,
                        },
                    },
                },
            };
        } else if (filters?.atividade_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador: {
                            atividade_id: filters?.atividade_id,
                        },
                    },
                },
            };
        }

        const listActive = await this.prisma.variavel.findMany({
            where: {
                ...filterQuery,
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                acumulativa: true,
                casas_decimais: true,
                fim_medicao: true,
                inicio_medicao: true,
                atraso_meses: true,
                unidade_medida: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },
                ano_base: true,
                valor_base: true,
                periodicidade: true,
                orgao: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },
                regiao: {
                    select: {
                        id: true,
                        nivel: true,
                        descricao: true,
                        parente_id: true,
                        codigo: true,
                    },
                },
                indicador_variavel: {
                    select: {
                        desativado: true,
                        id: true,
                        indicador_origem: {
                            select: {
                                id: true,
                                titulo: true,
                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                        indicador: {
                            select: {
                                id: true,
                                titulo: true,
                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                    },
                },
                variavel_responsavel: {
                    select: {
                        pessoa: { select: { id: true, nome_exibicao: true } },
                    },
                },
            },
        });

        const ret = listActive.map(row => {
            const responsaveis = row.variavel_responsavel.map(responsavel => {
                return {
                    id: responsavel.pessoa.id,
                    nome_exibicao: responsavel.pessoa.nome_exibicao,
                };
            });

            let indicador_variavel: typeof row.indicador_variavel = [];
            // filtra as variaveis novamente caso tiver filtros por indicador ou atividade
            if (filters?.indicador_id || filters?.iniciativa_id || filters?.atividade_id) {
                for (const iv of row.indicador_variavel) {
                    if (filters?.atividade_id && filters?.atividade_id === iv.indicador.atividade?.id) {
                        indicador_variavel.push(iv);
                    } else if (filters?.indicador_id && filters?.indicador_id === iv.indicador.id) {
                        indicador_variavel.push(iv);
                    } else if (filters?.iniciativa_id && filters?.iniciativa_id === iv.indicador.iniciativa?.id) {
                        indicador_variavel.push(iv);
                    }
                }
            } else {
                indicador_variavel = row.indicador_variavel;
            }

            return {
                ...row,
                inicio_medicao: Date2YMD.toStringOrNull(row.inicio_medicao),
                fim_medicao: Date2YMD.toStringOrNull(row.fim_medicao),
                variavel_responsavel: undefined,
                indicador_variavel: indicador_variavel,
                responsaveis: responsaveis,
            };
        });

        return ret;
    }

    async update(variavelId: number, updateVariavelDto: UpdateVariavelDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id

        // buscando apenas pelo indicador pai verdadeiro desta variavel
        const selfIdicadorVariavel = await this.prisma.indicadorVariavel.findFirst({
            where: { variavel_id: variavelId, indicador_origem_id: null },
            select: { indicador_id: true, variavel: { select: { valor_base: true, periodicidade: true } } },
        });
        if (!selfIdicadorVariavel) throw new HttpException('Variavel não encontrada', 400);

        const meta_id = await this.getMetaIdDoIndicador(selfIdicadorVariavel.indicador_id, this.prisma);
        if (!user.hasSomeRoles(['CadastroIndicador.editar', 'PDM.admin_cp'])) {
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(meta_id) === false) throw new HttpException('Sem permissão para criar variável nesta meta', 400);
        }

        const oldValorBase = selfIdicadorVariavel.variavel.valor_base;
        // e com o indicador verdadeiro, temos os dados para recalcular os niveis
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: selfIdicadorVariavel.indicador_id },
            select: {
                id: true,
                iniciativa_id: true,
                atividade_id: true,
                meta_id: true,
                periodicidade: true,
            },
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 400);

        let oldValue = selfIdicadorVariavel.variavel.periodicidade;
        if (updateVariavelDto.periodicidade) oldValue = updateVariavelDto.periodicidade;

        if (oldValue === indicador.periodicidade) {
            updateVariavelDto.fim_medicao = null;
            updateVariavelDto.inicio_medicao = null;
        } else {
            ['inicio_medicao', 'fim_medicao'].forEach((e: 'inicio_medicao' | 'fim_medicao') => {
                if (updateVariavelDto[e] === null) {
                    throw new HttpException(`${e}| ${InicioFimErrMsg}`, 400);
                }
            });
        }

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const responsaveis = updateVariavelDto.responsaveis;
            delete updateVariavelDto.responsaveis;

            const updated = await prismaTxn.variavel.update({
                where: { id: variavelId },
                data: {
                    ...updateVariavelDto,
                },
                select: {
                    valor_base: true,
                },
            });

            if (responsaveis) {
                await this.resyncIndicadorVariavel(indicador, variavelId, prismaTxn);
                await prismaTxn.variavelResponsavel.deleteMany({
                    where: { variavel_id: variavelId },
                });

                await prismaTxn.variavelResponsavel.createMany({
                    data: await this.buildVarResponsaveis(variavelId, responsaveis),
                });
            }

            if (Number(oldValorBase).toString() !== Number(updated.valor_base).toString()) {
                await this.recalc_variaveis_acumulada([variavelId], prismaTxn);
            }
        });

        return { id: variavelId };
    }

    async getIndicadorViaVariavel(variavel_id: number) {
        const indicador = await this.prisma.indicador.findFirst({
            where: {
                IndicadorVariavel: {
                    some: {
                        variavel_id: variavel_id,
                        indicador_origem_id: null, // fix - nao era necessário antes de existir essa coluna
                    },
                },
            },
            select: {
                IndicadorVariavel: {
                    select: {
                        variavel: {
                            select: {
                                id: true,
                                casas_decimais: true,
                                periodicidade: true,
                                acumulativa: true,
                            },
                        },
                    },
                },
            },
        });
        if (!indicador) throw new HttpException('Indicador ou variavel não encontrada', 404);
        return indicador;
    }

    async getValorSerieExistente(variavelId: number, series: Serie[]): Promise<ValorSerieExistente[]> {
        return await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id: variavelId,
                serie: {
                    in: series,
                },
            },
            select: {
                valor_nominal: true,
                id: true,
                data_valor: true,
                serie: true,
                conferida: true,
            },
        });
    }

    getValorSerieExistentePorPeriodo(valoresExistentes: ValorSerieExistente[], variavel_id: number): SerieValorPorPeriodo {
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

            porPeriodo[Date2YMD.toString(serieValor.data_valor)][serieValor.serie] = {
                data_valor: Date2YMD.toString(serieValor.data_valor),
                valor_nominal: serieValor.valor_nominal.toPrecision(),
                referencia: this.getEditExistingSerieJwt(serieValor.id, variavel_id),
                conferida: serieValor.conferida,
            };
        }

        return porPeriodo;
    }

    async getSeriePrevistoRealizado(variavelId: number) {
        const indicador = await this.getIndicadorViaVariavel(variavelId);
        const indicadorVariavelRelList = indicador.IndicadorVariavel.filter(v => {
            return v.variavel.id === variavelId;
        });
        const variavel = indicadorVariavelRelList[0].variavel;

        const valoresExistentes = await this.getValorSerieExistente(variavelId, ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado']);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes, variavelId);

        const result: ListSeriesAgrupadas = {
            variavel: {
                id: variavelId,
                casas_decimais: variavel.casas_decimais,
                periodicidade: variavel.periodicidade,
                acumulativa: variavel.acumulativa,
            },
            linhas: [],
            ordem_series: ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'],
        };

        // TODO bloquear acesso ao token pra quem não tiver o CadastroIndicador.inserir

        const todosPeriodos = await this.gerarPeriodoVariavelEntreDatas(variavel.id);
        for (const periodoYMD of todosPeriodos) {
            const seriesExistentes: SerieValorNomimal[] = [];

            const existeValor = porPeriodo[periodoYMD];
            if (existeValor && (existeValor.Previsto || existeValor.PrevistoAcumulado || existeValor.Realizado || existeValor.RealizadoAcumulado)) {
                if (existeValor.Previsto) {
                    seriesExistentes.push(existeValor.Previsto);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                }

                if (existeValor.PrevistoAcumulado) {
                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.PrevistoAcumulado));
                } else {
                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado')));
                }

                if (existeValor.Realizado) {
                    seriesExistentes.push(existeValor.Realizado);
                } else {
                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
                }

                if (existeValor.RealizadoAcumulado) {
                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.RealizadoAcumulado));
                } else {
                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado')));
                }
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado'));
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

    private referencia_boba(varServerSideAcumulativa: boolean, sv: SerieValorNomimal): SerieValorNomimal {
        if (varServerSideAcumulativa) {
            sv.referencia = 'SS';
        }
        return sv;
    }

    private buildNonExistingSerieValor(periodo: DateYMD, variavelId: number, serie: Serie): SerieValorNomimal {
        return {
            data_valor: periodo,
            referencia: this.getEditNonExistingSerieJwt(variavelId, periodo, serie),
            valor_nominal: '',
        };
    }

    private getEditExistingSerieJwt(id: number, variavelId: number): string {
        // TODO opcionalmente adicionar o modificado_em aqui
        return this.jwtService.sign({
            id: id,
            v: variavelId,
        } as ExistingSerieJwt);
    }

    private getEditNonExistingSerieJwt(variavelId: number, period: DateYMD, serie: Serie): string {
        return this.jwtService.sign({
            p: period,
            v: variavelId,
            s: serie,
        } as NonExistingSerieJwt);
    }

    private async gerarPeriodoVariavelEntreDatas(variavelId: number): Promise<DateYMD[]> {
        const dados: Record<string, string>[] = await this.prisma.$queryRaw`
            select to_char(p.p, 'yyyy-mm-dd') as dt
            from busca_periodos_variavel(${variavelId}::int) as g(p, inicio, fim),
            generate_series(inicio, fim, p) p
        `;

        return dados.map(e => e.dt);
    }

    private validarValoresJwt(valores: SerieUpsert[]): ValidatedUpsert[] {
        const valids: ValidatedUpsert[] = [];
        console.log({ log: 'validation', valores });
        for (const valor of valores) {
            if (valor.referencia === 'SS')
                // server-side
                continue;
            let referenciaDecoded: SerieJwt | null = null;
            try {
                referenciaDecoded = this.jwtService.decode(valor.referencia) as SerieJwt;
            } catch (error) {
                this.logger.error(error);
            }
            if (!referenciaDecoded) throw new HttpException('Tempo para edição dos valores já expirou. Abra em uma nova aba e faça o preenchimento novamente.', 400);

            valids.push({
                valor: valor.valor,
                referencia: referenciaDecoded,
            });
        }
        this.logger.debug(JSON.stringify({ log: 'validation', valids }));
        return valids;
    }

    async batchUpsertSerie(valores: SerieUpsert[], user: PessoaFromJwt) {
        // TODO opcionalmente verificar se o modificado_em de todas as variáveis ainda é igual
        // em relação ao momento JWT foi assinado, pra evitar sobrescrita da informação sem aviso para o usuário
        // da mesma forma, ao buscar os que não tem ID, não deve existir outro valor já existente no periodo

        const valoresValidos = this.validarValoresJwt(valores);

        const variaveisModificadas: Record<number, boolean> = {};

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const idsToBeRemoved: number[] = [];
                const updatePromises: Promise<any>[] = [];
                const createList: Prisma.SerieVariavelUncheckedCreateInput[] = [];
                let anySerieIsToBeCreatedOnVariable: number | undefined;

                for (const valor of valoresValidos) {
                    // busca os valores vazios mas que já existem, para serem removidos
                    if (valor.valor === '' && 'id' in valor.referencia) {
                        idsToBeRemoved.push(valor.referencia.id);

                        if (!variaveisModificadas[valor.referencia.v]) {
                            variaveisModificadas[valor.referencia.v] = true;
                        }
                    } else if (valor.valor) {
                        if (!variaveisModificadas[valor.referencia.v]) {
                            variaveisModificadas[valor.referencia.v] = true;
                        }

                        if ('id' in valor.referencia) {
                            updatePromises.push(
                                prismaTxn.serieVariavel.updateMany({
                                    where: {
                                        id: valor.referencia.id,
                                        valor_nominal: {
                                            not: valor.valor,
                                        },
                                    },
                                    data: {
                                        valor_nominal: valor.valor,
                                        atualizado_em: new Date(Date.now()),
                                        atualizado_por: user.id,
                                        conferida: true,
                                    },
                                }),
                            );
                        } else {
                            if (!anySerieIsToBeCreatedOnVariable) anySerieIsToBeCreatedOnVariable = valor.referencia.v;
                            createList.push({
                                valor_nominal: valor.valor,
                                variavel_id: valor.referencia.v,
                                serie: valor.referencia.s,
                                data_valor: Date2YMD.fromString(valor.referencia.p),
                                conferida: true,
                            });
                        }
                    } // else "não há valor" e não tem ID, ou seja, n precisa acontecer nada no banco
                }
                console.log({ idsToBeRemoved, anySerieIsToBeCreatedOnVariable, updatePromises, createList });
                // apenas um select pra forçar o banco fazer o serialize na variavel
                // ja que o prisma não suporta 'select for update'
                if (anySerieIsToBeCreatedOnVariable) await prismaTxn.variavel.findFirst({ where: { id: anySerieIsToBeCreatedOnVariable }, select: { id: true } });

                if (updatePromises.length) await Promise.all(updatePromises);

                // TODO: maybe pode verificar aqui o resultado e fazer o exception caso tenha removido alguma
                if (createList.length)
                    await prismaTxn.serieVariavel.deleteMany({
                        where: {
                            OR: createList.map(e => {
                                return {
                                    data_valor: e.data_valor,
                                    variavel_id: e.variavel_id,
                                    serie: e.serie,
                                };
                            }),
                        },
                    });

                // ja este delete é esperado caso tenha valores pra ser removidos
                if (idsToBeRemoved.length)
                    await prismaTxn.serieVariavel.deleteMany({
                        where: {
                            id: { in: idsToBeRemoved },
                        },
                    });

                if (createList.length)
                    await prismaTxn.serieVariavel.createMany({
                        data: createList,
                    });

                const variaveisMod = Object.keys(variaveisModificadas).map(e => +e);
                this.logger.log(`Variáveis modificadas: ${JSON.stringify(variaveisMod)}`);
                await this.recalc_variaveis_acumulada(variaveisMod, prismaTxn);
                await this.recalc_indicador_usando_variaveis(variaveisMod, prismaTxn);
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            },
        );
    }

    async recalc_variaveis_acumulada(variaveis: number[], prismaTxn: Prisma.TransactionClient) {
        this.logger.log(`called recalc_variaveis_acumulada (${JSON.stringify(variaveis)})`);
        const afetadas = await prismaTxn.variavel.findMany({
            where: {
                id: { in: variaveis },
                acumulativa: true,
            },
            select: {
                id: true,
            },
        });
        this.logger.log(`query.afetadas => ${JSON.stringify(afetadas)}`);
        for (const row of afetadas) {
            this.logger.debug(`Recalculando serie acumulada variavel ${row.id}...`);
            await prismaTxn.$queryRaw`select monta_serie_acumulada(${row.id}::int, null)`;
        }
    }

    async recalc_indicador_usando_variaveis(variaveis: number[], prismaTxn: Prisma.TransactionClient) {
        this.logger.log(`called recalc_indicador_usando_variaveis (${JSON.stringify(variaveis)})`);
        const indicadores = await prismaTxn.indicadorFormulaVariavel.findMany({
            where: {
                variavel_id: { in: variaveis },
            },
            distinct: ['indicador_id'],
            select: {
                indicador_id: true,
            },
        });
        this.logger.log(`query.indicadores => ${JSON.stringify(indicadores)}`);
        for (const row of indicadores) {
            this.logger.log(`Recalculando indicador ... ${row.indicador_id}`);
            await prismaTxn.$queryRaw`select monta_serie_indicador(${row.indicador_id}::int, null, null, null)`;
        }
    }

    async getMetaIdDaVariavel(variavel_id: number, prismaTxn: Prisma.TransactionClient): Promise<number> {
        const result: {
            meta_id: number;
        }[] = await prismaTxn.$queryRaw`
            select coalesce(

                -- busca pela diretamente na meta
                (
                    select m.id
                    from meta m
                    join indicador i on i.meta_id = m.id and i.removido_em is null
                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
                    where iv.variavel_id = ${variavel_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join indicador i on  i.iniciativa_id = _i.id
                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
                    where iv.variavel_id = ${variavel_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join atividade _a on _a.iniciativa_id = _i.id
                    join indicador i on  i.atividade_id = _a.id
                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
                    where iv.variavel_id = ${variavel_id}::int
                    and i.removido_em is null
                )
            ) as meta_id
        `;
        console.log(result);

        if (!result[0].meta_id) throw `getMetaIdDaVariavel: nenhum resultado para variavel ${variavel_id}`;
        return result[0].meta_id;
    }

    async getMetaIdDoIndicador(indicador_id: number, prismaTxn: Prisma.TransactionClient): Promise<number> {
        const result: {
            meta_id: number;
        }[] = await prismaTxn.$queryRaw`
            select coalesce(
                -- busca pela diretamente na meta
                (
                    select m.id
                    from meta m
                    join indicador i on i.meta_id = m.id and i.removido_em is null
                    where i.id = ${indicador_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join indicador i on  i.iniciativa_id = _i.id
                    where i.id = ${indicador_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join atividade _a on _a.iniciativa_id = _i.id
                    join indicador i on  i.atividade_id = _a.id
                    where i.id = ${indicador_id}::int
                    and i.removido_em is null
                )
            ) as meta_id
        `;
        console.log(result);

        if (!result[0].meta_id) throw `getMetaIdDoIndicador: nenhum resultado para indicador ${indicador_id}`;
        return result[0].meta_id;
    }
}
