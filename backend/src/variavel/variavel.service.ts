import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    Periodicidade,
    Prisma,
    Serie,
    TipoVariavel,
    TipoVariavelCategorica,
    VariavelCategoricaValor,
} from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CONST_CRONO_VAR_CATEGORICA_ID } from '../common/consts';
import { Date2YMD, DateYMD } from '../common/date2ymd';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
    ExistingSerieJwt,
    NonExistingSerieJwt,
    SerieJwt,
    SerieUpsert,
    ValidatedUpsert,
} from './dto/batch-serie-upsert.dto';
import {
    CreateGeradorVariaveBaselDto,
    CreateGeradorVariavePDMlDto,
    CreateGeradorVariavelPDMDto,
    CreatePeloIndicadorDto,
    CreateVariavelBaseDto,
    CreateVariavelPDMDto,
    VariaveisPeriodosDto,
} from './dto/create-variavel.dto';
import { FilterVariavelDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas } from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import {
    SerieValorNomimal,
    SerieValorPorPeriodo,
    ValorSerieExistente,
    VariavelItemDto,
} from './entities/variavel.entity';

/**
 * ordem que é populado na função populaSeriesExistentes, usada no serviço do VariavelFormulaCompostaService
 */
export const ORDEM_SERIES_RETORNO: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];

const InicioFimErrMsg =
    'Inicio/Fim da medição da variável não pode ser nulo quando a periodicidade da variável é diferente do indicador';

type IndicadorInfo = {
    id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;
    regionalizavel: boolean;
    nivel_regionalizacao: number | null;
    meta_id: number | null;
    periodicidade?: Periodicidade;
};

export type VariavelComCategorica = {
    id: number;
    acumulativa: boolean;
    variavel_categorica: {
        id: number;
        tipo: TipoVariavelCategorica;
        valores: VariavelCategoricaValor[];
    } | null;
};

@Injectable()
export class VariavelService {
    private readonly logger = new Logger(VariavelService.name);
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService
    ) {}

    async loadVariaveisComCategorica(
        prismaTxn: Prisma.TransactionClient,
        variavelId: number[]
    ): Promise<VariavelComCategorica[]> {
        const rows = await prismaTxn.variavel.findMany({
            where: { id: { in: variavelId } },
            select: {
                id: true,
                acumulativa: true,
                variavel_categorica: {
                    select: {
                        id: true,
                        tipo: true,
                        valores: true,
                    },
                },
            },
        });
        for (const v of rows) {
            if (v && v.variavel_categorica?.tipo == 'Cronograma')
                throw new HttpException('Variável do tipo Cronograma não pode ser atualizada', 400);
        }

        return rows;
    }

    async loadVariavelComCategorica(
        prismaTxn: Prisma.TransactionClient,
        variavelId: number
    ): Promise<VariavelComCategorica> {
        const v = await this.loadVariaveisComCategorica(prismaTxn, [variavelId]);

        if (v.length == 0) throw new HttpException('Variável não encontrada', 400);
        return v[0];
    }

    async buildVarResponsaveis(
        variableId: number,
        responsaveis: number[]
    ): Promise<Prisma.VariavelResponsavelCreateManyInput[]> {
        const arr: Prisma.VariavelResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                variavel_id: variableId,
                pessoa_id: pessoaId,
            });
        }
        return arr;
    }

    async create(tipo: TipoVariavel, dto: CreateVariavelBaseDto | CreateVariavelPDMDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos
        // e sao realmente do órgão createVariavelDto.orgao_id

        if (dto.supraregional === null) delete dto.supraregional;

        let indicador: IndicadorInfo | undefined = undefined;
        if (tipo == 'PDM') {
            if (!('indicador_id' in dto) || !dto.indicador_id)
                throw new BadRequestException('Indicador é obrigatório para variáveis do PDM');

            indicador = await this.buscaIndicadorParaVariavel(dto.indicador_id);

            this.fixIndicadorInicioFim(dto, indicador);

            await this.checkPermissionsPDM(dto, user);
        } else if (tipo == 'Global') {
            // Dunno yet
        } else {
            throw new BadRequestException('Tipo de variável inválido para criação manual');
        }

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.variavel_categorica_id !== null && dto.variavel_categorica_id) {
                    await this.carregaVariavelCategorica(prismaTxn, dto.variavel_categorica_id);
                }

                if (indicador) {
                    if (indicador.regionalizavel && dto.regiao_id) {
                        const regiao = await this.prisma.regiao.findFirstOrThrow({
                            where: { id: dto.regiao_id },
                            select: { nivel: true },
                        });

                        if (regiao.nivel != indicador.nivel_regionalizacao)
                            throw new BadRequestException(
                                `O nível da região (${regiao.nivel}) precisa ser igual ao do indicador (${indicador.nivel_regionalizacao})`
                            );
                    }

                    if (!indicador.regionalizavel && dto.regiao_id)
                        throw new BadRequestException(`Indicador sem regionalização, não é possível enviar região.`);
                }

                return await this.performVariavelSave(tipo, prismaTxn, dto, indicador, dto.responsaveis);
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 60 * 1000,
                timeout: 120 * 1000,
            }
        );

        return { id: created.id };
    }

    async create_region_generated(
        tipo: TipoVariavel,
        dto: CreateGeradorVariaveBaselDto | CreateGeradorVariavelPDMDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId[]> {
        const regioesDb = await this.prisma.regiao.findMany({
            where: { id: { in: dto.regioes }, pdm_codigo_sufixo: { not: null }, removido_em: null },
            select: { nivel: true },
        });
        if (regioesDb.length != dto.regioes.length)
            throw new HttpException('Todas as regiões precisam ter um código de sufixo configurado', 400);

        const porNivel: Record<number, number> = {};
        for (const r of regioesDb) {
            if (!porNivel[r.nivel]) porNivel[r.nivel] = 0;
            porNivel[r.nivel]++;
        }
        if (Object.keys(porNivel).length != 1)
            throw new HttpException('Todas as regiões precisam ser do mesmo nível', 400);

        let indicador_id: number | undefined = undefined;
        if (tipo == 'PDM') {
            if (!('indicador_id' in dto))
                throw new BadRequestException('Indicador é obrigatório para variáveis do PDM');

            await this.checkPermissionsPDM(dto, user);
            indicador_id = dto.indicador_id;
        }

        const responsaveis = dto.responsaveis;

        const indicador = indicador_id ? await this.buscaIndicadorParaVariavel(indicador_id) : undefined;

        if (indicador) this.fixIndicadorInicioFim(dto, indicador);
        // TODO para Global: aqui precisa calcular o inicio/fim da variavel de alguma forma, ou obrigar a passar

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId[]> => {
                const ids: number[] = [];

                const regions = await this.prisma.regiao.findMany({
                    where: { id: { in: dto.regioes }, pdm_codigo_sufixo: { not: null }, removido_em: null },
                    select: { pdm_codigo_sufixo: true, descricao: true, id: true },
                });

                const prefixo = dto.codigo;
                delete (dto as any).regioes;
                delete (dto as any).codigo;
                for (const regiao of regions) {
                    const variavel = await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto, // aqui eu passo tudo, pq no performVariavelSave eu deixo só o que é necessário
                            titulo: dto.titulo + ' ' + regiao.descricao,
                            codigo: prefixo + regiao.pdm_codigo_sufixo,
                            regiao_id: regiao.id,
                        },
                        indicador,
                        responsaveis
                    );
                    ids.push(variavel.id);
                }

                if (dto.supraregional) {
                    await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto, // aqui eu deixo tudo tbm, só pra não duplicar 100%
                            titulo: dto.titulo,
                            codigo: prefixo,
                        },
                        indicador,
                        responsaveis
                    );
                }

                return ids.map((n) => ({ id: n }));
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 60 * 1000,
                timeout: 120 * 1000,
            }
        );

        return created;
    }

    private async performVariavelSave(
        tipo: TipoVariavel,
        prismaTxn: Prisma.TransactionClient,
        dto: CreateVariavelBaseDto,
        indicador: IndicadorInfo | undefined,
        responsaveis: number[]
    ) {
        const indicador_id = indicador?.id;
        const jaEmUso = await prismaTxn.variavel.count({
            where: {
                removido_em: null,
                codigo: dto.codigo,

                OR: [
                    indicador_id
                        ? {
                              tipo: 'PDM',
                              indicador_variavel: {
                                  some: {
                                      indicador_id: indicador_id,
                                  },
                              },
                          }
                        : {},
                    {
                        tipo: 'Global',
                    },
                ],
            },
        });
        if (jaEmUso > 0 && tipo == 'PDM')
            throw new BadRequestException(`Código ${dto.codigo} já está em uso no indicador.`);
        if (jaEmUso > 0 && tipo == 'Global')
            throw new BadRequestException(`Código ${dto.codigo} já está em uso no sistema.`);

        // TODO verificar quem pode usar o orgao_proprietario_id
        // TODO orgao_proprietario_id, validacao_grupo_ids, liberacao_grupo_ids

        const periodos = this.getPeriodTuples(dto.periodos);

        const variavel = await prismaTxn.variavel.create({
            data: {
                tipo,
                titulo: dto.titulo,
                codigo: dto.codigo,
                acumulativa: dto.acumulativa,
                mostrar_monitoramento: dto.mostrar_monitoramento,
                unidade_medida_id: dto.unidade_medida_id,
                ano_base: dto.ano_base,
                valor_base: dto.valor_base,
                periodicidade: dto.periodicidade,
                orgao_id: dto.orgao_id,
                regiao_id: dto.regiao_id,
                variavel_categorica_id: dto.variavel_categorica_id,
                casas_decimais: dto.casas_decimais,
                atraso_meses: dto.atraso_meses,
                inicio_medicao: dto.inicio_medicao,
                fim_medicao: dto.fim_medicao,
                supraregional: dto.supraregional,

                dado_aberto: dto.dado_aberto,
                metodologia: dto.metodologia,
                descricao: dto.descricao,
                fonte_id: dto.fonte_id,
                orgao_proprietario_id: dto.orgao_proprietario_id,
                nivel_regionalizacao: dto.nivel_regionalizacao,

                ...periodos,

                indicador_variavel: indicador_id ? { create: { indicador_id: indicador_id } } : undefined,
                VariavelAssuntoVariavel: {
                    createMany:
                        Array.isArray(dto.assuntos) && dto.assuntos.length > 0
                            ? { data: dto.assuntos.map((assunto_id) => ({ assunto_variavel_id: assunto_id })) }
                            : undefined,
                },
            },
            select: { id: true },
        });

        if (indicador) await this.resyncIndicadorVariavel(indicador, variavel.id, prismaTxn);

        await prismaTxn.variavelResponsavel.createMany({
            data: await this.buildVarResponsaveis(variavel.id, responsaveis),
        });

        await this.recalc_variaveis_acumulada([variavel.id], prismaTxn);

        return variavel;
    }

    private getPeriodTuples(p: VariaveisPeriodosDto | null): {
        periodo_preenchimento: number[];
        periodo_validacao: number[];
        periodo_liberacao: number[];
    } {
        const periodo_preenchimento: number[] = [];
        const periodo_validacao: number[] = [];
        const periodo_liberacao: number[] = [];

        // se caiu nessa função é pq quer atualizar
        if (!p || !Array.isArray(p)) return { periodo_preenchimento, periodo_validacao, periodo_liberacao };

        if (p.preenchimento_inicio >= p.preenchimento_fim) {
            throw new Error('Preenchimento: Início deve ser menor que fim');
        }
        if (p.validacao_inicio >= p.validacao_fim) {
            throw new Error('Validação: Início deve ser menor que fim');
        }
        if (p.liberacao_inicio >= p.liberacao_fim) {
            throw new Error('Liberação: Início deve ser menor que fim');
        }

        // Cada período de preenchimento deve ser menor que o próximo
        if (p.preenchimento_fim >= p.validacao_inicio) {
            throw new Error('Preenchimento fim deve ser menor que Validação início');
        }
        if (p.validacao_fim >= p.liberacao_inicio) {
            throw new Error('Validação fim deve ser menor que Liberação início');
        }

        return {
            periodo_preenchimento: [p.preenchimento_inicio, p.preenchimento_inicio],
            periodo_liberacao: [p.liberacao_inicio, p.liberacao_fim],
            periodo_validacao: [p.validacao_inicio, p.validacao_fim],
        };
    }

    private async fixIndicadorInicioFim(
        createVariavelDto: CreateVariavelBaseDto | CreateGeradorVariaveBaselDto,
        indicador: IndicadorInfo
    ) {
        if (createVariavelDto.atraso_meses === undefined) createVariavelDto.atraso_meses = 1;
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
    }

    async buscaIndicadorParaVariavel(indicador_id: number) {
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: indicador_id, removido_em: null },
            select: {
                id: true,
                iniciativa_id: true,
                atividade_id: true,
                meta_id: true,
                periodicidade: true,
                regionalizavel: true,
                nivel_regionalizacao: true,
            },
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 400);
        return indicador;
    }

    private async checkPermissionsPDM(
        createVariavelDto: CreateVariavelPDMDto | CreateGeradorVariavePDMlDto,
        user: PessoaFromJwt
    ) {
        const meta_id = await this.getMetaIdDoIndicador(createVariavelDto.indicador_id, this.prisma);
        if (!user.hasSomeRoles(['CadastroIndicador.inserir', 'PDM.admin_cp'])) {
            const filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel);
            if (filterIdIn.includes(meta_id) === false)
                throw new HttpException('Sem permissão para criar variável nesta meta', 400);
        }
    }

    async resyncIndicadorVariavel(indicador: IndicadorInfo, variavel_id: number, prisma: Prisma.TransactionClient) {
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
                    this.logger.warn(
                        `resyncIndicadorVariavel: Atividade ID=${indicador.atividade_id} compoe_indicador_iniciativa mas não tem indicador ativo`
                    );
                } else {
                    const data = {
                        indicador_id: indicadorDaIniciativa.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }

                // atividade tbm compõe a meta, então precisa levar essa variavel para lá também
                // 'recursão' manual
                if (atividade.iniciativa.compoe_indicador_meta) {
                    this.logger.log(
                        `resyncIndicadorVariavel: iniciativa da atividade compoe_indicador_meta, buscando indicador da meta`
                    );
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
                        this.logger.warn(
                            `resyncIndicadorVariavel: indicador da meta ${atividade.iniciativa.meta_id} não foi encontrado!`
                        );
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
                    this.logger.warn(
                        `resyncIndicadorVariavel: Iniciativa ${indicador.iniciativa_id} compoe_indicador_meta mas não tem indicador ativo na meta`
                    );
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

    async findAll(tipo: TipoVariavel, filters: FilterVariavelDto | undefined = undefined): Promise<VariavelItemDto[]> {
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
                removido_em: null,
                VariavelAssuntoVariavel: Array.isArray(filters?.assuntos)
                    ? { some: { assunto_variavel: { id: { in: filters.assuntos } } } }
                    : undefined,
                id: filters?.id,

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
                suspendida_em: true,
                mostrar_monitoramento: true,
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
                        pdm_codigo_sufixo: true,
                    },
                },
                VariavelAssuntoVariavel: {
                    select: { assunto_variavel: { select: { id: true, nome: true } } },
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
                variavel_categorica_id: true,
            },
        });

        const variaveisCrono = listActive.filter((v) => v.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID);
        const etapaDoCrono = await this.prisma.etapa.findMany({
            where: {
                variavel_id: { in: variaveisCrono.map((v) => v.id) },
            },
            select: {
                id: true,
                variavel_id: true,
                titulo: true,
            },
        });
        const mapEtapa = etapaDoCrono.reduce((acc: Record<string, any>, etapa: any) => {
            acc[etapa.variavel_id!] = {
                id: etapa.id,
                titulo: etapa.titulo ?? '',
            };
            return acc;
        }, {});

        const ret = listActive.map((row) => {
            const responsaveis = row.variavel_responsavel.map((responsavel) => {
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
                assunto_variavel: row.VariavelAssuntoVariavel.map((v) => v.assunto_variavel),
                etapa: row.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID ? mapEtapa[row.id] : null,
                inicio_medicao: Date2YMD.toStringOrNull(row.inicio_medicao),
                fim_medicao: Date2YMD.toStringOrNull(row.fim_medicao),
                variavel_responsavel: undefined,
                indicador_variavel: indicador_variavel,
                responsaveis: responsaveis,
                suspendida: row.suspendida_em ? true : false,
            };
        });

        return ret;
    }

    async update(tipo: TipoVariavel, variavelId: number, dto: UpdateVariavelDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id

        const selfBefUpdate = await this.prisma.variavel.findFirstOrThrow({
            where: { id: variavelId, tipo, removido_em: null },
            select: {
                periodicidade: true,
                supraregional: true,
                variavel_categorica_id: true,
            },
        });
        if (selfBefUpdate.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID)
            throw new HttpException('Variável do tipo Cronograma não pode ser atualizada', 400);

        let indicador_id: number | undefined = undefined;
        if (tipo == 'PDM') {
            // buscando apenas pelo indicador pai verdadeiro desta variavel
            const selfIndicadorVariavel = await this.prisma.indicadorVariavel.findFirst({
                where: { variavel_id: variavelId, indicador_origem_id: null },
                select: {
                    indicador_id: true,
                },
            });

            if (!selfIndicadorVariavel)
                throw new HttpException('Variavel não encontrada, confira se você está no indicador base', 400);

            // check de permissões
            const meta_id = await this.getMetaIdDoIndicador(selfIndicadorVariavel.indicador_id, this.prisma);
            // OBS: como que chega aqui sem ser pela controller? na controller pede pelo [CadastroIndicador.editar]
            if (!user.hasSomeRoles(['CadastroIndicador.editar', 'PDM.admin_cp'])) {
                const filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel);
                if (filterIdIn.includes(meta_id) === false)
                    throw new HttpException('Sem permissão para criar variável nesta meta', 400);
            }

            indicador_id = selfIndicadorVariavel.indicador_id;
        }

        if (dto.codigo !== undefined) {
            const jaEmUso = await this.prisma.variavel.count({
                where: {
                    removido_em: null,
                    codigo: dto.codigo,
                    NOT: { id: variavelId },

                    OR: [
                        {
                            tipo: 'Global',
                        },
                        indicador_id
                            ? {
                                  tipo: 'PDM',
                                  indicador_variavel: { some: { indicador_id: indicador_id } },
                              }
                            : {},
                    ],
                },
            });
            if (jaEmUso > 0) throw new HttpException(`Código ${dto.codigo} já está em uso no indicador.`, 400);
        }

        // e com o indicador verdadeiro, temos os dados para recalcular os níveis
        const indicador = indicador_id ? await this.buscaIndicadorParaVariavel(indicador_id) : undefined;

        let oldValue = selfBefUpdate.periodicidade;
        if (dto.periodicidade) oldValue = dto.periodicidade;

        if (tipo == 'PDM') {
            if (!indicador) throw new BadRequestException('Indicador é necessário para variáveis do PDM');
            if (oldValue === indicador.periodicidade) {
                dto.fim_medicao = null;
                dto.inicio_medicao = null;
            } else {
                ['inicio_medicao', 'fim_medicao'].forEach((e: 'inicio_medicao' | 'fim_medicao') => {
                    if (dto[e] === null) {
                        throw new HttpException(`${e}| ${InicioFimErrMsg}`, 400);
                    }
                });
            }
        } else if (tipo == 'Global') {
            //
        }

        // Quando a variável é supraregional, está sendo enviado regiao_id = 0
        // Portanto tratando para não dar problema com a FK no Prisma.
        if (dto.regiao_id == 0 && selfBefUpdate.supraregional == true) delete dto.regiao_id;

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const responsaveis = dto.responsaveis;
            const suspendida = dto.suspendida;

            const self = await prismaTxn.variavel.findFirstOrThrow({
                where: { id: variavelId },
                select: {
                    mostrar_monitoramento: true,
                    suspendida_em: true,
                    valor_base: true,
                    VariavelAssuntoVariavel: {
                        select: {
                            assunto_variavel_id: true,
                        },
                    },
                },
            });
            const currentSuspendida = self.suspendida_em !== null;

            if (suspendida === true && currentSuspendida == false) {
                dto.mostrar_monitoramento = false;
            } else if (suspendida === false && currentSuspendida == true) {
                // retorna ao state que estava antes de desativar
                const prevDesativado = await prismaTxn.variavelSuspensaoLog.findFirst({
                    where: { variavel_id: variavelId },
                    orderBy: { criado_em: 'desc' },
                    select: { previo_status_mostrar_monitoramento: true },
                    take: 1,
                });

                dto.mostrar_monitoramento = prevDesativado?.previo_status_mostrar_monitoramento ?? true;
            }

            const old_variavel_categorica_id = selfBefUpdate.variavel_categorica_id;

            if (dto.variavel_categorica_id !== null && dto.variavel_categorica_id) {
                const variavelCategorica = await this.carregaVariavelCategorica(prismaTxn, dto.variavel_categorica_id);

                if (old_variavel_categorica_id == variavelCategorica.id) {
                    this.logger.debug(`variavel_categorica_id já é igual, não há necessidade de alterar`);

                    dto.variavel_categorica_id = undefined;
                }

                if (dto.variavel_categorica_id) {
                    const existentes = await prismaTxn.serieVariavel.count({
                        where: { variavel_id: variavelId, variavel_categorica_id: dto.variavel_categorica_id },
                    });
                    if (existentes > 0)
                        throw new BadRequestException(
                            'Não é possível alterar a variável categórica de uma variável que já possui valores salvos como variável categórica.'
                        );

                    const categoriaValores = await prismaTxn.variavelCategoricaValor.findMany({
                        where: { id: dto.variavel_categorica_id },
                    });

                    const serieValores = await prismaTxn.serieVariavel.groupBy({
                        where: {
                            variavel_id: variavelId,
                            serie: { in: ['Realizado', 'Previsto'] },
                        },
                        by: ['valor_nominal'],
                    });

                    const promises: Promise<unknown>[] = [];
                    for (const sv of serieValores) {
                        const catValor = categoriaValores.find(
                            (cv) => cv.valor_variavel == +sv.valor_nominal.toString()
                        );
                        if (!catValor)
                            throw new BadRequestException(
                                'Não é possível adicionar classificação da categórica, pois há valores salvos incompatíveis. Valores encontrados: ' +
                                    serieValores
                                        .slice(0, 10)
                                        .map((v) => v.valor_nominal)
                                        .join(', ')
                            );

                        promises.push(
                            prismaTxn.serieVariavel.updateMany({
                                where: {
                                    variavel_id: variavelId,
                                    serie: { in: ['Realizado', 'Previsto'] },
                                    valor_nominal: sv.valor_nominal,
                                },
                                data: {
                                    variavel_categorica_id: dto.variavel_categorica_id,
                                    variavel_categorica_valor_id: catValor.id,
                                },
                            })
                        );
                    }
                    await Promise.all(promises);
                }
            } else if (dto.variavel_categorica_id === null && old_variavel_categorica_id !== null) {
                await prismaTxn.serieVariavel.updateMany({
                    where: {
                        variavel_id: variavelId,
                        variavel_categorica_id: old_variavel_categorica_id,
                    },
                    data: {
                        variavel_categorica_id: null,
                        variavel_categorica_valor_id: null,
                    },
                });

                this.logger.debug(`variavel_categorica_id foi removido, valores em serie-variavel mantidos`);
            }

            if (Array.isArray(dto.assuntos)) {
                const assuntoSorted = dto.assuntos.sort();
                const currentAssuntos = self.VariavelAssuntoVariavel.map((v) => v.assunto_variavel_id).sort();

                if (assuntoSorted.join(',') !== currentAssuntos.join(',')) {
                    this.logger.debug(`Assuntos diferentes, atualizando`);
                    await prismaTxn.variavelAssuntoVariavel.deleteMany({
                        where: { variavel_id: variavelId },
                    });
                    await prismaTxn.variavelAssuntoVariavel.createMany({
                        data: assuntoSorted.map((assunto_id) => ({
                            variavel_id: variavelId,
                            assunto_variavel_id: assunto_id,
                        })),
                    });
                }
            } else if (dto.assuntos == null) {
                await prismaTxn.variavelAssuntoVariavel.deleteMany({
                    where: { variavel_id: variavelId },
                });
            }

            // TODO: mesmos TODO do create, verificar quem pode usar o orgao_proprietario_id
            // TODO orgao_proprietario_id, validacao_grupo_ids, liberacao_grupo

            const updated = await prismaTxn.variavel.update({
                where: { id: variavelId },
                data: {
                    titulo: dto.titulo,
                    codigo: dto.codigo,
                    acumulativa: dto.acumulativa,
                    mostrar_monitoramento: dto.mostrar_monitoramento,
                    unidade_medida_id: dto.unidade_medida_id,
                    ano_base: dto.ano_base,
                    valor_base: dto.valor_base,
                    periodicidade: dto.periodicidade,
                    orgao_id: dto.orgao_id,
                    regiao_id: dto.regiao_id,
                    variavel_categorica_id: dto.variavel_categorica_id,
                    casas_decimais: dto.casas_decimais,
                    atraso_meses: dto.atraso_meses,
                    inicio_medicao: dto.inicio_medicao,
                    fim_medicao: dto.fim_medicao,

                    dado_aberto: dto.dado_aberto,
                    metodologia: dto.metodologia,
                    descricao: dto.descricao,
                    fonte_id: dto.fonte_id,
                    orgao_proprietario_id: dto.orgao_proprietario_id,
                    nivel_regionalizacao: dto.nivel_regionalizacao,

                    ...(dto.periodos ? this.getPeriodTuples(dto.periodos) : {}),

                    suspendida_em: suspendida ? now : null,
                },
                select: {
                    valor_base: true,
                },
            });

            if (suspendida !== undefined && suspendida !== currentSuspendida) {
                await prismaTxn.variavelSuspensaoLog.create({
                    data: {
                        variavel_id: variavelId,
                        pessoa_id: user.id,
                        suspendida: suspendida,
                        criado_em: now,
                        previo_status_mostrar_monitoramento: self.mostrar_monitoramento,
                    },
                });
            }

            if (Array.isArray(responsaveis)) {
                if (indicador) await this.resyncIndicadorVariavel(indicador, variavelId, prismaTxn);
                await prismaTxn.variavelResponsavel.deleteMany({
                    where: { variavel_id: variavelId },
                });

                await prismaTxn.variavelResponsavel.createMany({
                    data: await this.buildVarResponsaveis(variavelId, responsaveis),
                });
            }

            if (Number(self.valor_base).toString() !== Number(updated.valor_base).toString()) {
                await this.recalc_variaveis_acumulada([variavelId], prismaTxn);
            }
        });

        return { id: variavelId };
    }

    private async carregaVariavelCategorica(prismaTxn: Prisma.TransactionClient, variavel_categorica_id: number) {
        const variavelCategorica = await prismaTxn.variavelCategorica.findFirstOrThrow({
            where: { id: variavel_categorica_id },
            select: { tipo: true, id: true },
        });
        if (variavelCategorica.tipo == 'Cronograma')
            throw new BadRequestException('Variável categórica de cronograma não pode ser criada manualmente');
        return variavelCategorica;
    }

    async processVariaveisSuspensas(prismaTx: Prisma.TransactionClient): Promise<number[]> {
        const suspensas: { variaveis: number[] | null }[] = await prismaTx.$queryRaw`
            WITH jobs AS (
                SELECT
                    v.id as variavel_id,
                    v.atraso_meses * '-1 month'::interval as atraso_meses,
                    v.acumulativa as v_acumulativa,
                    v.suspendida_em,
                    cf.id AS cf_corrente_id,
                    cf.data_ciclo AS cf_corrente_data_ciclo,
                    s.serie AS serie,
                    pdm.id as pdm_id
                FROM variavel v
                INNER JOIN indicador_variavel iv ON iv.variavel_id = v.id AND iv.indicador_origem_id is null
                INNER JOIN indicador i ON iv.indicador_id = i.id AND i.removido_em is null
                LEFT JOIN meta m ON i.meta_id = m.id AND i.removido_em is null
                LEFT JOIN iniciativa ini ON i.iniciativa_id = ini.id AND ini.removido_em is null
                LEFT JOIN meta m2 ON ini.meta_id = m2.id AND m2.removido_em is null
                LEFT JOIN atividade a ON i.atividade_id = a.id AND a.removido_em is null
                LEFT JOIN iniciativa ini2 ON a.iniciativa_id = ini2.id AND ini2.removido_em is null
                LEFT JOIN meta m3 ON ini2.meta_id = m3.id AND m3.removido_em is null
                INNER JOIN pdm
                    ON CASE
                        WHEN m.id IS NOT NULL THEN m.pdm_id = pdm.id
                        WHEN m2.id IS NOT NULL THEN m2.pdm_id = pdm.id
                        WHEN m3.id IS NOT NULL THEN m3.pdm_id = pdm.id
                    END
                JOIN ciclo_fisico cf ON
                    cf.pdm_id = pdm.id
                    AND cf.data_ciclo > v.suspendida_em
                    AND cf.data_ciclo <= now()
                CROSS JOIN (
                    SELECT unnest(enum_range(NULL::"Serie")) serie
                ) s
                LEFT JOIN variavel_suspensa_controle vsc ON vsc.ciclo_fisico_corrente_id = cf.id AND vsc.variavel_id = v.id AND vsc.serie = s.serie
                WHERE s.serie IN ('Realizado', 'RealizadoAcumulado')
                AND vsc.id IS NULL
                ORDER BY cf.id
            ),
            lookup_valores AS (
                SELECT
                    j.variavel_id,
                    j.atraso_meses,
                    j.v_acumulativa,
                    j.suspendida_em,
                    j.cf_corrente_id,
                    j.cf_corrente_data_ciclo,
                    j.serie,
                    cf.id AS cf_base_id,
                    CASE WHEN v_acumulativa THEN 0::decimal
                    ELSE
                        -- não faz muito sentido não ter valor acumulado, mas se estiver faltando, é pq alguem apagou do banco na mão
                        CASE WHEN sv.valor_nominal IS NULL AND j.serie = 'RealizadoAcumulado' THEN 0 ELSE sv.valor_nominal END
                    END AS valor
                FROM jobs j
                JOIN ciclo_fisico cf ON cf.pdm_id = j.pdm_id AND cf.data_ciclo = date_trunc('month', j.suspendida_em)
                LEFT JOIN serie_variavel sv ON sv.variavel_id = j.variavel_id
                    AND sv.data_valor = date_trunc('month', j.suspendida_em) + j.atraso_meses
                    AND sv.serie = j.serie
                ORDER BY j.cf_corrente_data_ciclo
            ),
            lookup_existentes AS (
                SELECT
                    j.cf_corrente_id,
                    j.variavel_id,
                    j.serie,
                    sv.valor_nominal,
                    sv.id as sv_id
                FROM jobs j

                LEFT JOIN serie_variavel sv ON sv.variavel_id = j.variavel_id
                    AND sv.data_valor = j.cf_corrente_data_ciclo + j.atraso_meses
                    AND sv.serie = j.serie

            ),
            delete_values AS (
                DELETE FROM serie_variavel WHERE id IN (SELECT sv_id FROM lookup_existentes)
            ),
            insert_values AS (
                INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal, ciclo_fisico_id)
                SELECT
                    lv.variavel_id,
                    lv.serie,
                    lv.cf_corrente_data_ciclo + lv.atraso_meses,
                    lv.valor,
                    lv.cf_corrente_id
                FROM lookup_valores lv
                WHERE lv.valor IS NOT NULL
            ),
            insert_control AS (
                INSERT INTO variavel_suspensa_controle (variavel_id, serie, ciclo_fisico_base_id, ciclo_fisico_corrente_id, valor_antigo, valor_novo, processado_em)
                SELECT
                    lv.variavel_id,
                    lv.serie,
                    lv.cf_base_id,
                    lv.cf_corrente_id,
                    le.valor_nominal,
                    lv.valor,
                    now()
                FROM lookup_valores lv
                LEFT JOIN lookup_existentes le ON le.variavel_id = lv.variavel_id AND lv.serie = le.serie AND lv.cf_corrente_id = le.cf_corrente_id
            ),
            must_update_indicators AS (
                SELECT
                    lv.variavel_id
                FROM lookup_valores lv
                GROUP BY 1
            )
            SELECT
                array_agg(variavel_id) as variaveis
            FROM must_update_indicators
        `;

        console.log('must_update_indicators: suspensas=', suspensas);
        if (suspensas[0] && Array.isArray(suspensas[0].variaveis)) {
            return suspensas[0].variaveis;
        }
        return [];
    }

    async remove(tipo: TipoVariavel, variavelId: number, user: PessoaFromJwt) {
        // buscando apenas pelo indicador pai verdadeiro desta variavel
        const selfIdicadorVariavel = await this.prisma.indicadorVariavel.findFirst({
            where: { variavel_id: variavelId, indicador_origem_id: null },
            select: {
                indicador_id: true,
                variavel: {
                    select: {
                        valor_base: true,
                        periodicidade: true,
                        variavel_categorica_id: true,
                    },
                },
            },
        });
        if (!selfIdicadorVariavel)
            throw new BadRequestException('Variavel não encontrada, confira se você está no indicador base');
        if (selfIdicadorVariavel.variavel.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID)
            throw new BadRequestException(
                'Variável do tipo Cronograma não pode ser removida pela variável, remova pela etapa'
            );

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const refEmUso = await prismaTxn.indicadorFormulaVariavel.findMany({
                    where: { variavel_id: variavelId },
                    select: {
                        indicador: { select: { codigo: true, titulo: true } },
                    },
                });

                for (const ref of refEmUso) {
                    throw new BadRequestException(
                        `Não é possível remover a variável: em uso no indicador ${ref.indicador.codigo}, ${ref.indicador.titulo}`
                    );
                }

                const refFormulaComposta = await prismaTxn.formulaComposta.findMany({
                    where: {
                        removido_em: null,
                        FormulaCompostaVariavel: {
                            some: {
                                variavel_id: variavelId,
                            },
                        },
                    },
                    select: { titulo: true },
                });
                for (const ref of refFormulaComposta) {
                    throw new BadRequestException(
                        `Não é possível remover a variável: em uso na variável composta ${ref.titulo}`
                    );
                }

                await prismaTxn.variavel.update({
                    where: { id: variavelId },
                    data: {
                        removido_em: new Date(Date.now()),
                        removido_por: user.id,
                    },
                    select: { id: true },
                });

                await prismaTxn.indicadorVariavel.deleteMany({
                    where: { variavel_id: variavelId },
                });
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            }
        );

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
                                titulo: true,
                                codigo: true,
                                suspendida_em: true,
                            },
                        },
                    },
                },
            },
        });
        if (!indicador) throw new HttpException('Indicador ou variavel não encontrada', 404);
        return indicador;
    }

    async getValorSerieExistente(
        variavelId: number,
        series: Serie[],
        data_valor: Date | undefined
    ): Promise<ValorSerieExistente[]> {
        return await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id: variavelId,
                serie: {
                    in: series,
                },
                data_valor: data_valor,
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

    getValorSerieExistentePorPeriodo(
        valoresExistentes: ValorSerieExistente[],
        variavel_id: number
    ): SerieValorPorPeriodo {
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

    async getSeriePrevistoRealizado(tipo: TipoVariavel, variavelId: number) {
        const indicador = await this.getIndicadorViaVariavel(variavelId);
        const indicadorVariavelRelList = indicador.IndicadorVariavel.filter((v) => {
            return v.variavel.id === variavelId;
        });
        const variavel = indicadorVariavelRelList[0].variavel;

        const valoresExistentes = await this.getValorSerieExistente(variavelId, ORDEM_SERIES_RETORNO, undefined);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes, variavelId);

        const result: ListSeriesAgrupadas = {
            variavel: {
                id: variavelId,
                casas_decimais: variavel.casas_decimais,
                periodicidade: variavel.periodicidade,
                acumulativa: variavel.acumulativa,
                codigo: variavel.codigo,
                titulo: variavel.titulo,
                suspendida: variavel.suspendida_em ? true : false,
            },
            linhas: [],
            ordem_series: ORDEM_SERIES_RETORNO,
        };

        // TODO bloquear acesso ao token pra quem não tiver o CadastroIndicador.inserir

        const todosPeriodos = await this.gerarPeriodoVariavelEntreDatas(variavel.id);
        for (const periodoYMD of todosPeriodos) {
            const seriesExistentes: SerieValorNomimal[] = this.populaSeriesExistentes(
                porPeriodo,
                periodoYMD,
                variavelId,
                variavel
            );

            result.linhas.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
            });
        }

        return result;
    }

    populaSeriesExistentes(
        porPeriodo: SerieValorPorPeriodo,
        periodoYMD: string,
        variavelId: number,
        variavel: { acumulativa: boolean }
    ) {
        const seriesExistentes: SerieValorNomimal[] = [];

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
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
            }

            if (existeValor.PrevistoAcumulado) {
                seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.PrevistoAcumulado));
            } else {
                seriesExistentes.push(
                    this.referencia_boba(
                        variavel.acumulativa,
                        this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado')
                    )
                );
            }

            if (existeValor.Realizado) {
                seriesExistentes.push(existeValor.Realizado);
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
            }

            if (existeValor.RealizadoAcumulado) {
                seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.RealizadoAcumulado));
            } else {
                seriesExistentes.push(
                    this.referencia_boba(
                        variavel.acumulativa,
                        this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado')
                    )
                );
            }
        } else {
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado'));
        }
        return seriesExistentes;
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

        return dados.map((e) => e.dt);
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
                referenciaDecoded = this.jwtService.verify(valor.referencia) as SerieJwt;
            } catch (error) {
                this.logger.error(error);
            }
            if (!referenciaDecoded)
                throw new HttpException(
                    'Tempo para edição dos valores já expirou. Abra em uma nova aba e faça o preenchimento novamente.',
                    400
                );

            // se chegou como number, converte pra string
            const asText =
                typeof valor.valor == 'number' && valor.valor !== undefined
                    ? Number(valor.valor).toString()
                    : valor.valor;

            // garantia que o tipo é ou string, ou um texto em branco
            valids.push({
                valor: typeof asText === 'string' ? asText : '',
                referencia: referenciaDecoded,
            });
        }
        this.logger.debug(JSON.stringify({ log: 'validation', valids }));
        return valids;
    }

    async batchUpsertSerie(tipo: TipoVariavel, valores: SerieUpsert[], user: PessoaFromJwt) {
        // TODO opcionalmente verificar se o modificado_em de todas as variáveis ainda é igual
        // em relação ao momento JWT foi assinado, pra evitar sobrescrita da informação sem aviso para o usuário
        // da mesma forma, ao buscar os que não tem ID, não deve existir outro valor já existente no periodo

        const valoresValidos = this.validarValoresJwt(valores);

        const variaveisInfo = await this.loadVariaveisComCategorica(
            this.prisma,
            valoresValidos.map((e) => e.referencia.v)
        );

        const variaveisModificadas: Record<number, boolean> = {};
        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const idsToBeRemoved: number[] = [];
                const updatePromises: Promise<any>[] = [];
                const createList: Prisma.SerieVariavelUncheckedCreateInput[] = [];
                let anySerieIsToBeCreatedOnVariable: number | undefined;

                for (const valor of valoresValidos) {
                    const variavelInfo = variaveisInfo.filter((e) => e.id === valor.referencia.v)[0];
                    if (!variavelInfo) throw new Error('Variável não encontrada, mas deveria já ter sido carregada.');

                    let variavel_categorica_valor_id: number | null = null;
                    // busca os valores vazios mas que já existem, para serem removidos
                    if (valor.valor === '' && 'id' in valor.referencia) {
                        idsToBeRemoved.push(valor.referencia.id);

                        if (!variaveisModificadas[valor.referencia.v]) {
                            variaveisModificadas[valor.referencia.v] = true;
                        }
                    } else if (valor.valor !== '') {
                        if (!variaveisModificadas[valor.referencia.v]) {
                            variaveisModificadas[valor.referencia.v] = true;
                        }
                        if (variavelInfo.variavel_categorica) {
                            const valorExiste = variavelInfo.variavel_categorica.valores.find(
                                (v) => v.valor_variavel === +valor.valor
                            );
                            if (!valorExiste)
                                throw new HttpException(
                                    `Valor ${valor.valor} não é permitido para a variável categórica`,
                                    400
                                );
                            variavel_categorica_valor_id = valorExiste.id;
                        }

                        if ('id' in valor.referencia) {
                            updatePromises.push(
                                prismaTxn.serieVariavel.updateMany({
                                    where: {
                                        id: valor.referencia.id,

                                        AND: [
                                            {
                                                OR: [
                                                    {
                                                        valor_nominal: {
                                                            not: valor.valor,
                                                        },
                                                    },
                                                    {
                                                        conferida: false,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    data: {
                                        valor_nominal: valor.valor,
                                        atualizado_em: now,
                                        atualizado_por: user.id,
                                        conferida: true,
                                        conferida_por: user.id,
                                        conferida_em: now,
                                        variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                                        variavel_categorica_valor_id,
                                    },
                                })
                            );
                        } else {
                            if (!anySerieIsToBeCreatedOnVariable) anySerieIsToBeCreatedOnVariable = valor.referencia.v;
                            createList.push({
                                valor_nominal: valor.valor,
                                variavel_id: valor.referencia.v,
                                serie: valor.referencia.s,
                                data_valor: Date2YMD.fromString(valor.referencia.p),
                                conferida: true,
                                conferida_em: now,
                                conferida_por: user.id,
                                variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                                variavel_categorica_valor_id,
                            });
                        }
                    } // else "não há valor" e não tem ID, ou seja, n precisa acontecer nada no banco
                }
                console.log({ idsToBeRemoved, anySerieIsToBeCreatedOnVariable, updatePromises, createList });
                // apenas um select pra forçar o banco fazer o serialize na variavel
                // ja que o prisma não suporta 'select for update'
                if (anySerieIsToBeCreatedOnVariable)
                    await prismaTxn.variavel.findFirst({
                        where: { id: anySerieIsToBeCreatedOnVariable },
                        select: { id: true },
                    });

                if (updatePromises.length) await Promise.all(updatePromises);

                // TODO: maybe pode verificar aqui o resultado e fazer o exception caso tenha removido alguma
                if (createList.length)
                    await prismaTxn.serieVariavel.deleteMany({
                        where: {
                            OR: createList.map((e) => {
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

                const variaveisMod = Object.keys(variaveisModificadas).map((e) => +e);
                this.logger.log(`Variáveis modificadas: ${JSON.stringify(variaveisMod)}`);

                if (Array.isArray(variaveisMod)) {
                    await this.recalc_variaveis_acumulada(variaveisMod, prismaTxn);
                    await this.recalc_indicador_usando_variaveis(variaveisMod, prismaTxn);
                }
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            }
        );
    }

    async recalc_variaveis_acumulada(variaveis: number[], prismaTxn: Prisma.TransactionClient) {
        this.logger.log(`called recalc_variaveis_acumulada (${JSON.stringify(variaveis)})`);
        const afetadas = await prismaTxn.variavel.findMany({
            where: {
                id: { in: variaveis },
                acumulativa: true,
                removido_em: null,
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
        const indicadoresFv = await prismaTxn.indicadorFormulaVariavel.findMany({
            where: {
                variavel_id: { in: variaveis },
            },
            distinct: ['indicador_id'],
            select: { indicador_id: true },
        });
        const indicadoresFC = await prismaTxn.indicador.findMany({
            where: {
                removido_em: null,
                FormulaComposta: {
                    some: {
                        formula_composta: {
                            removido_em: null,
                            FormulaCompostaVariavel: {
                                some: { variavel_id: { in: variaveis } },
                            },
                        },
                    },
                },
            },
            select: { id: true },
        });
        const uniqueIndicadores = Array.from(
            new Set([...indicadoresFC.map((r) => r.id), ...indicadoresFv.map((r) => r.indicador_id)])
        );

        this.logger.log(`query.indicadores => ${uniqueIndicadores.join(',')}`);
        for (const indicador_id of uniqueIndicadores) {
            this.logger.log(`Recalculando indicador ... ${indicador_id}`);
            await prismaTxn.$queryRaw`select refresh_serie_indicador(${indicador_id}::int, null)`;
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

    async getMetaIdDaFormulaComposta(
        formula_composta_id: number,
        prismaTxn: Prisma.TransactionClient
    ): Promise<number> {
        const result: {
            meta_id: number;
        }[] = await prismaTxn.$queryRaw`
            select coalesce(
                -- busca pela diretamente na meta
                (
                    select m.id
                    from meta m
                    join indicador i on i.meta_id = m.id and i.removido_em is null
                    join indicador_formula_composta fc on fc.indicador_id = i.id and fc.desativado=false and fc.indicador_origem_id is null
                    where fc.formula_composta_id = ${formula_composta_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join indicador i on  i.iniciativa_id = _i.id
                    join indicador_formula_composta fc on fc.indicador_id = i.id and fc.desativado=false and fc.indicador_origem_id is null
                    where fc.formula_composta_id = ${formula_composta_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join atividade _a on _a.iniciativa_id = _i.id
                    join indicador i on  i.atividade_id = _a.id
                    join indicador_formula_composta fc on fc.indicador_id = i.id and fc.desativado=false and fc.indicador_origem_id is null
                    where fc.formula_composta_id = ${formula_composta_id}::int
                    and i.removido_em is null
                )
            ) as meta_id
        `;
        console.log(result);

        if (!result[0].meta_id)
            throw `getMetaIdDaFormulaComposta: nenhum resultado para formula_composta ${formula_composta_id}`;
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

    async criarVariavelCronograma(
        dto: CreatePeloIndicadorDto,
        user: PessoaFromJwt,
        prismaTxn: Prisma.TransactionClient,
        now: Date
    ): Promise<RecordWithId> {
        const indicador = await prismaTxn.indicador.findFirstOrThrow({
            where: { id: dto.indicador_id },
        });
        const jaEmUso = await prismaTxn.variavel.count({
            where: {
                removido_em: null,
                codigo: dto.codigo,
                indicador_variavel: {
                    some: {
                        indicador_id: indicador.id,
                    },
                },
            },
        });
        if (jaEmUso > 0) throw new HttpException(`Código ${dto.codigo} já está em uso no indicador.`, 400);

        const variavel = await prismaTxn.variavel.create({
            data: {
                codigo: dto.codigo,
                titulo: dto.titulo,
                orgao_id: dto.orgao_id,
                casas_decimais: 0,
                acumulativa: true,
                variavel_categorica_id: CONST_CRONO_VAR_CATEGORICA_ID,
                mostrar_monitoramento: false,
                suspendida_em: now,
                unidade_medida_id: 1,
                valor_base: 0,
                atraso_meses: 0, // acho que não faz sentido ser 1, vou de 0
                periodicidade: indicador.periodicidade,
                inicio_medicao: indicador.inicio_medicao,
                fim_medicao: indicador.fim_medicao,
            },
            select: { id: true },
        });

        await prismaTxn.indicadorVariavel.create({
            data: {
                variavel_id: variavel.id,
                indicador_id: dto.indicador_id,
                desativado: false,
            },
        });

        return { id: variavel.id };
    }
}
