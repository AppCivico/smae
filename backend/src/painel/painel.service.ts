import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PainelConteudoTipoDetalhe, Periodicidade, Periodo, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DateTime } from 'luxon';
import * as moment from 'moment';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import {
    PainelConteudoSerie,
    SerieRow,
    SeriesTemplate,
    SimplifiedPainelConteudoSeries,
} from './dto/detalhe-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import {
    PainelConteudoDetalheUpdateRet,
    PainelConteudoIdAndMeta,
    PainelConteudoUpsertRet,
    UpdatePainelConteudoDetalheDto,
    UpdatePainelConteudoVisualizacaoDto,
} from './dto/update-painel-conteudo.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';
import { IdTituloPeriodicidade } from '../reports/monitoramento-mensal/entities/monitoramento-mensal.entity';
import { PainelDto } from './entities/painel.entity';
import { Date2YMD } from '../common/date2ymd';

export class PainelConteudoForSync {
    id: number;
    meta_id: number;
    mostrar_indicador: boolean;
}

export class PainelConteudoDetalheForSync {
    id: number;
    variavel_id?: number | null;
    iniciativa_id?: number | null;
    atividade_id?: number | null;
    tipo?: string | null;
}

export class PainelDateRange {
    start: Date;
    end: Date;
}

@Injectable()
export class PainelService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createPainelDto: CreatePainelDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.painel.count({
            where: {
                nome: { equals: createPainelDto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const grupos_to_assign = [];
                if (createPainelDto.grupos) {
                    const grupos = createPainelDto.grupos;
                    delete createPainelDto.grupos;

                    for (const grupo of grupos) {
                        grupos_to_assign.push({ grupo_painel_id: grupo });
                    }
                }

                const pdm_ativo = await prisma.pdm.findFirstOrThrow({
                    where: { ativo: true },
                    select: { id: true },
                });

                const painel = await prisma.painel.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        pdm_id: pdm_ativo.id,
                        ...createPainelDto,

                        grupos: {
                            createMany: {
                                data: grupos_to_assign,
                            },
                        },
                    },
                    select: { id: true },
                });

                return painel;
            }
        );

        return created;
    }

    async findAll(
        filters: FilterPainelDto | undefined = undefined,
        restringirGrupos: boolean,
        user: PessoaFromJwt
    ): Promise<PainelDto[]> {
        let ativo = filters?.ativo;

        // por padrão filtra apenas os ativos (acho que é pra remover esse padrão)
        if (typeof ativo === 'undefined') {
            ativo = true;
        }

        let userGrupos = undefined;
        if (restringirGrupos) {
            userGrupos = await this.prisma.pessoaGrupoPainel.findMany({
                where: { pessoa_id: user.id },
                select: { grupo_painel_id: true },
            });
        }

        const rows = await this.prisma.painel.findMany({
            where: {
                ativo: ativo,
                removido_em: null,

                grupos: userGrupos
                    ? {
                          some: {
                              grupo_painel: {
                                  id: {
                                      in: userGrupos.map((g) => g.grupo_painel_id),
                                  },
                              },
                          },
                      }
                    : undefined,

                painel_conteudo: filters?.meta_id
                    ? {
                          some: {
                              meta_id: filters.meta_id,
                          },
                      }
                    : undefined,
            },
            select: {
                id: true,
                nome: true,
                ativo: true,
                periodicidade: true,
                mostrar_planejado_por_padrao: true,
                mostrar_acumulado_por_padrao: true,
                mostrar_indicador_por_padrao: true,

                painel_conteudo: {
                    where: { meta_id: filters?.meta_id },
                    select: {
                        id: true,
                        meta_id: true,
                        indicador_id: true,
                        mostrar_planejado: true,
                        mostrar_acumulado: true,
                        mostrar_indicador: true,
                        mostrar_acumulado_periodo: true,
                        periodicidade: true,
                        periodo: true,
                        periodo_fim: true,
                        periodo_inicio: true,
                        periodo_valor: true,

                        detalhes: {
                            where: {
                                pai_id: null,
                            },
                            orderBy: [{ ordem: 'asc' }],
                            select: {
                                id: true,
                                tipo: true,
                                mostrar_indicador: true,
                                variavel: {
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
                                filhos: {
                                    select: {
                                        id: true,
                                        tipo: true,
                                        mostrar_indicador: true,

                                        variavel: {
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
                                        filhos: {
                                            select: {
                                                tipo: true,
                                                mostrar_indicador: true,

                                                variavel: {
                                                    select: {
                                                        id: true,
                                                        titulo: true,
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
            },
            orderBy: { nome: 'asc' },
        });

        return rows.map((r) => {
            return {
                ...r,
                painel_conteudo: r.painel_conteudo.map((pc) => {
                    return {
                        ...pc,
                        periodo_fim: Date2YMD.toStringOrNull(pc.periodo_fim),
                        periodo_inicio: Date2YMD.toStringOrNull(pc.periodo_inicio),
                    };
                }),
            };
        });
    }

    async getDetail(id: number): Promise<PainelDto> {
        const ret = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            const painel_conteudo: PainelConteudoForSync[] = await prisma.painelConteudo.findMany({
                where: { painel_id: id },
                select: {
                    id: true,
                    meta_id: true,
                    mostrar_indicador: true,
                },
            });

            await this.populatePainelConteudoDetalhe(painel_conteudo, prisma);

            return await prisma.painel.findFirstOrThrow({
                where: {
                    id: id,
                },
                select: {
                    id: true,
                    nome: true,
                    ativo: true,
                    periodicidade: true,
                    mostrar_planejado_por_padrao: true,
                    mostrar_acumulado_por_padrao: true,
                    mostrar_indicador_por_padrao: true,

                    grupos: {
                        select: {
                            grupo_painel: {
                                select: {
                                    id: true,
                                    nome: true,
                                },
                            },
                        },
                    },

                    painel_conteudo: {
                        select: {
                            id: true,
                            meta_id: true,
                            indicador_id: true,
                            mostrar_planejado: true,
                            mostrar_acumulado: true,
                            mostrar_indicador: true,
                            mostrar_acumulado_periodo: true,
                            periodicidade: true,
                            periodo: true,
                            periodo_fim: true,
                            periodo_inicio: true,
                            periodo_valor: true,

                            meta: {
                                select: {
                                    codigo: true,
                                    titulo: true,
                                },
                            },

                            detalhes: {
                                where: {
                                    pai_id: null,
                                    OR: [
                                        {
                                            variavel: {
                                                indicador_variavel: {
                                                    some: {
                                                        desativado: false,
                                                    },
                                                },
                                            },
                                        },
                                        { iniciativa: { removido_em: null } },
                                    ],
                                },
                                orderBy: [{ ordem: 'asc' }],
                                select: {
                                    id: true,
                                    tipo: true,
                                    mostrar_indicador: true,

                                    variavel: {
                                        select: {
                                            id: true,
                                            titulo: true,
                                            codigo: true,
                                        },
                                    },
                                    iniciativa: {
                                        select: {
                                            id: true,
                                            titulo: true,
                                            codigo: true,
                                        },
                                    },
                                    filhos: {
                                        where: {
                                            OR: [
                                                {
                                                    variavel: {
                                                        indicador_variavel: {
                                                            some: {
                                                                desativado: false,
                                                            },
                                                        },
                                                    },
                                                },
                                                { atividade: { removido_em: null } },
                                            ],
                                        },
                                        select: {
                                            id: true,
                                            tipo: true,
                                            mostrar_indicador: true,

                                            variavel: {
                                                select: {
                                                    id: true,
                                                    titulo: true,
                                                    codigo: true,
                                                },
                                            },
                                            atividade: {
                                                select: {
                                                    id: true,
                                                    titulo: true,
                                                    codigo: true,
                                                },
                                            },
                                            filhos: {
                                                select: {
                                                    id: true,
                                                    tipo: true,
                                                    mostrar_indicador: true,

                                                    variavel: {
                                                        select: {
                                                            id: true,
                                                            titulo: true,
                                                            codigo: true,
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
                },
            });
        });

        return {
            ...ret,
            painel_conteudo: ret.painel_conteudo.map((pc) => {
                return {
                    ...pc,
                    periodo_fim: Date2YMD.toStringOrNull(pc.periodo_fim),
                    periodo_inicio: Date2YMD.toStringOrNull(pc.periodo_inicio),
                };
            }),
        };
    }

    async getPainelShortData(opts: { painel_id: number }): Promise<IdTituloPeriodicidade | null> {
        return await this.prisma.painel.findFirst({
            where: { id: opts.painel_id, removido_em: null },
            select: {
                id: true,
                nome: true,
                periodicidade: true,
            },
        });
    }

    async update(id: number, updatePainelDto: UpdatePainelDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.painel.count({
            where: {
                nome: { equals: updatePainelDto.nome, mode: 'insensitive' },
                removido_em: null,
                NOT: { id: +id },
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Nome igual ou semelhante já existe em outro registro ativo', 400);

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const grupos_to_assign = [];
            if (updatePainelDto.grupos) {
                const grupos = updatePainelDto.grupos;
                delete updatePainelDto.grupos;

                for (const grupo of grupos) {
                    grupos_to_assign.push({ grupo_painel_id: grupo });
                }

                await prisma.painelGrupoPainel.deleteMany({
                    where: {
                        painel_id: id,
                        grupo_painel_id: {
                            in: grupos,
                        },
                    },
                });
            }

            const painel = await prisma.painel.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updatePainelDto,

                    grupos: {
                        createMany: {
                            data: grupos_to_assign,
                        },
                    },
                },
                select: { id: true },
            });

            return painel;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.painel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return removed;
    }

    async createConteudo(painel_id: number, createConteudoDto: CreateParamsPainelConteudoDto, user: PessoaFromJwt) {
        const ret = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<PainelConteudoUpsertRet> => {
                const painel = await this.prisma.painel.findFirstOrThrow({
                    where: { id: painel_id },
                    select: {
                        mostrar_acumulado_por_padrao: true,
                        mostrar_indicador_por_padrao: true,
                        mostrar_planejado_por_padrao: true,

                        periodicidade: true,

                        painel_conteudo: {
                            select: {
                                id: true,
                                meta_id: true,
                            },
                        },
                    },
                });

                const conteudos = [];
                for (const meta of createConteudoDto.metas) {
                    const conteudo_already_exists = painel.painel_conteudo.filter((r) => {
                        return r.meta_id === meta;
                    });
                    if (conteudo_already_exists.length > 0) continue;

                    conteudos.push(
                        prisma.painelConteudo.create({
                            data: {
                                painel_id: painel_id,
                                meta_id: meta,
                                mostrar_acumulado: painel.mostrar_acumulado_por_padrao,
                                mostrar_indicador: painel.mostrar_indicador_por_padrao,
                                mostrar_planejado: painel.mostrar_planejado_por_padrao,
                                periodicidade: painel.periodicidade,
                            },
                            select: { id: true, meta_id: true, mostrar_indicador: true },
                        })
                    );
                }
                const created = await Promise.all(conteudos);

                await this.populatePainelConteudoDetalhe(created, prisma);

                const deleted = await this.checkDeletedPainelConteudo(
                    createConteudoDto.metas,
                    painel.painel_conteudo,
                    prisma
                );

                return {
                    created: created,
                    deleted: deleted,
                };
            }
        );

        return ret;
    }

    async getPainelConteudoVisualizacao(id: number) {
        return await this.prisma.painelConteudo.findFirstOrThrow({
            where: { id: id },
            select: {
                id: true,
                periodicidade: true,
                periodo: true,
                periodo_valor: true,
                periodo_inicio: true,
                periodo_fim: true,
                mostrar_acumulado: true,
                mostrar_planejado: true,
                mostrar_acumulado_periodo: true,
                ordem: true,
            },
            orderBy: { id: 'desc' },
        });
    }

    async updatePainelConteudoVisualizacao(
        painel_id: number,
        painel_conteudo_id: number,
        updatePainelConteudoDto: UpdatePainelConteudoVisualizacaoDto
    ) {
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const painel_conteudo = await prisma.painelConteudo.findFirstOrThrow({ where: { id: painel_conteudo_id } });
            if (painel_conteudo.painel_id !== painel_id) throw new BadRequestException('painel_conteudo inválido');

            const updated_painel_conteudo = await prisma.painelConteudo.update({
                where: {
                    id: painel_conteudo_id,
                },
                data: {
                    ...updatePainelConteudoDto,
                },
                select: { id: true },
            });

            return updated_painel_conteudo;
        });

        return { id: painel_conteudo_id };
    }

    async updatePainelConteudoDetalhes(
        painel_id: number,
        painel_conteudo_id: number,
        updatePainelConteudoDetalheDto: UpdatePainelConteudoDetalheDto
    ) {
        const ret = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<PainelConteudoDetalheUpdateRet> => {
                const painel_conteudo = await prisma.painelConteudo.findFirstOrThrow({
                    where: { id: painel_conteudo_id },
                });
                if (painel_conteudo.painel_id !== painel_id) throw new BadRequestException('painel_conteudo inválido');

                const operations = [];
                if (
                    updatePainelConteudoDetalheDto.mostrar_indicador_meta ||
                    updatePainelConteudoDetalheDto.mostrar_indicador_meta === false
                ) {
                    const painel_conteudo = await prisma.painelConteudo.findFirst({
                        where: { id: painel_conteudo_id },
                        select: { mostrar_indicador: true },
                    });

                    if (painel_conteudo?.mostrar_indicador != updatePainelConteudoDetalheDto.mostrar_indicador_meta) {
                        operations.push(
                            prisma.painelConteudo.update({
                                where: { id: painel_conteudo_id },
                                data: { mostrar_indicador: updatePainelConteudoDetalheDto.mostrar_indicador_meta },
                                select: { id: true },
                            })
                        );
                    }
                }

                for (const detalhe of updatePainelConteudoDetalheDto.detalhes!) {
                    operations.push(
                        prisma.painelConteudoDetalhe.update({
                            where: {
                                id: detalhe.id,
                            },
                            data: { mostrar_indicador: detalhe.mostrar_indicador },
                            select: { id: true },
                        })
                    );
                }

                const updated = await Promise.all(operations);

                return { updated };
            }
        );

        return ret;
    }

    private async populatePainelConteudoDetalhe(conteudos: PainelConteudoForSync[], prisma: Prisma.TransactionClient) {
        const created: PainelConteudoDetalheForSync[] = [];
        const unchanged: PainelConteudoDetalheForSync[] = [];
        const existent_painel_conteudo_detalhes: PainelConteudoDetalheForSync[] = [];

        for (const painel_conteudo of conteudos) {
            const detalhes_db = await prisma.painelConteudoDetalhe.findMany({
                where: { painel_conteudo_id: painel_conteudo.id },
                select: {
                    id: true,
                    variavel_id: true,
                    iniciativa_id: true,
                    atividade_id: true,
                    tipo: true,

                    filhos: {
                        select: {
                            id: true,
                            variavel_id: true,
                            iniciativa_id: true,
                            atividade_id: true,
                            tipo: true,

                            filhos: {
                                select: {
                                    id: true,
                                    variavel_id: true,
                                    iniciativa_id: true,
                                    atividade_id: true,
                                    tipo: true,
                                },
                            },
                        },
                    },
                },
            });

            detalhes_db.forEach((i) => {
                existent_painel_conteudo_detalhes.push({
                    id: i.id,
                    variavel_id: i.variavel_id,
                    iniciativa_id: i.iniciativa_id,
                    atividade_id: i.atividade_id,
                    tipo: i.tipo,
                });

                i.filhos.forEach((f) => {
                    existent_painel_conteudo_detalhes.push({
                        id: f.id,
                        variavel_id: f.variavel_id,
                        iniciativa_id: f.iniciativa_id,
                        atividade_id: f.atividade_id,
                        tipo: f.tipo,
                    });

                    f.filhos.forEach((ff) => {
                        existent_painel_conteudo_detalhes.push({
                            id: ff.id,
                            variavel_id: ff.variavel_id,
                            iniciativa_id: ff.iniciativa_id,
                            atividade_id: ff.atividade_id,
                            tipo: ff.tipo,
                        });
                    });
                });
            });

            const meta_indicador = await prisma.indicador.findMany({
                where: {
                    meta: {
                        id: painel_conteudo.meta_id,
                        removido_em: null,
                    },
                    removido_em: null,
                    iniciativa_id: null,
                    atividade_id: null,
                },
                select: { id: true, meta_id: true },
            });

            // Primeiro nivel
            for (const row of meta_indicador) {
                const indicador_variaveis = await prisma.indicadorVariavel.findMany({
                    where: {
                        indicador: {
                            removido_em: null,
                            id: row.id,
                        },
                        desativado: false,
                    },
                    select: { variavel_id: true },
                });

                for (const row of indicador_variaveis) {
                    const already_exists = existent_painel_conteudo_detalhes.find(
                        (i) => i.variavel_id === row.variavel_id
                    );

                    if (already_exists) {
                        unchanged.push(already_exists);
                        continue;
                    } else {
                        const created_painel_conteudo_detalhe = await prisma.painelConteudoDetalhe.create({
                            data: {
                                painel_conteudo_id: painel_conteudo.id,
                                variavel_id: row.variavel_id,
                                mostrar_indicador: false,
                                tipo: PainelConteudoTipoDetalhe.Variavel,
                            },
                            select: {
                                id: true,
                                variavel_id: true,
                                tipo: true,
                            },
                        });
                        created.push(created_painel_conteudo_detalhe);
                    }
                }
            }

            const meta_iniciativas = await prisma.iniciativa.findMany({
                where: {
                    removido_em: null,
                    meta: {
                        removido_em: null,
                        id: painel_conteudo.meta_id,
                    },
                },
                select: { id: true },
            });

            // Segundo nível
            for (const iniciativa of meta_iniciativas) {
                let parent_iniciativa;

                const already_exists = existent_painel_conteudo_detalhes.find((i) => i.iniciativa_id === iniciativa.id);

                if (already_exists) {
                    parent_iniciativa = already_exists;
                    unchanged.push(already_exists);
                } else {
                    parent_iniciativa = await prisma.painelConteudoDetalhe.create({
                        data: {
                            painel_conteudo_id: painel_conteudo.id,
                            mostrar_indicador: false,
                            tipo: PainelConteudoTipoDetalhe.Iniciativa,
                            iniciativa_id: iniciativa.id,
                        },
                        select: {
                            id: true,
                            iniciativa_id: true,
                            tipo: true,
                        },
                    });
                    created.push(parent_iniciativa);
                }

                const iniciativa_variaveis = await prisma.indicadorVariavel.findMany({
                    where: {
                        indicador: {
                            removido_em: null,
                            iniciativa: {
                                removido_em: null,
                                id: iniciativa.id,
                            },
                        },
                        desativado: false,
                    },
                    select: { variavel_id: true },
                });

                for (const variavel of iniciativa_variaveis) {
                    const already_exists = existent_painel_conteudo_detalhes.find(
                        (i) => i.variavel_id == variavel.variavel_id
                    );

                    if (already_exists) {
                        unchanged.push(already_exists);
                        continue;
                    } else {
                        const created_painel_conteudo_detalhe = await prisma.painelConteudoDetalhe.create({
                            data: {
                                painel_conteudo_id: painel_conteudo.id,
                                variavel_id: variavel.variavel_id,
                                mostrar_indicador: false,
                                tipo: PainelConteudoTipoDetalhe.Variavel,
                                pai_id: parent_iniciativa.id,
                            },
                            select: {
                                id: true,
                                variavel_id: true,
                                tipo: true,
                            },
                        });
                        created.push(created_painel_conteudo_detalhe);
                    }
                }

                // Terceiro nível
                const atividades = await prisma.atividade.findMany({
                    where: {
                        removido_em: null,
                        iniciativa: {
                            removido_em: null,
                            id: iniciativa.id,
                        },
                    },
                    select: { id: true },
                });

                for (const atividade of atividades) {
                    let parent_atividade;

                    const already_exists = existent_painel_conteudo_detalhes.find(
                        (i) => i.atividade_id == atividade.id
                    );
                    if (already_exists) {
                        parent_atividade = already_exists;
                        unchanged.push(already_exists);
                    } else {
                        const created_painel_conteudo_detalhe = (parent_atividade =
                            await prisma.painelConteudoDetalhe.create({
                                data: {
                                    painel_conteudo_id: painel_conteudo.id,
                                    mostrar_indicador: false,
                                    tipo: PainelConteudoTipoDetalhe.Atividade,
                                    pai_id: parent_iniciativa.id,
                                    atividade_id: atividade.id,
                                },
                                select: {
                                    id: true,
                                    atividade_id: true,
                                    tipo: true,
                                },
                            }));
                        created.push(created_painel_conteudo_detalhe);
                    }

                    const atividade_variaveis = await prisma.indicadorVariavel.findMany({
                        where: {
                            indicador: {
                                removido_em: null,
                                atividade: {
                                    id: atividade.id,
                                    removido_em: null,
                                },
                            },
                            desativado: false,
                        },
                        select: { variavel_id: true },
                    });

                    for (const variavel of atividade_variaveis) {
                        const already_exists = existent_painel_conteudo_detalhes.find(
                            (i) => i.variavel_id == variavel.variavel_id
                        );

                        if (already_exists) {
                            unchanged.push(already_exists);
                            continue;
                        } else {
                            const created_painel_conteudo_detalhe = await prisma.painelConteudoDetalhe.create({
                                data: {
                                    painel_conteudo_id: painel_conteudo.id,
                                    variavel_id: variavel.variavel_id,
                                    mostrar_indicador: false,
                                    tipo: PainelConteudoTipoDetalhe.Variavel,
                                    pai_id: parent_atividade.id,
                                },
                                select: {
                                    id: true,
                                    variavel_id: true,
                                    tipo: true,
                                },
                            });
                            created.push(created_painel_conteudo_detalhe);
                        }
                    }
                }
            }
        }

        // Tratando rows que precisam ser deletadas
        const saved_rows: PainelConteudoDetalheForSync[] = unchanged.concat(created);
        const deleted: PainelConteudoDetalheForSync[] = existent_painel_conteudo_detalhes.filter(
            (e) => !saved_rows.includes(e)
        );

        console.log('lgt existent_painel_conteudo_detalhes=' + existent_painel_conteudo_detalhes.length);
        console.log('lgt unchanged=' + unchanged.length);
        console.log('lgt created=' + created.length);
        console.log('lgt saved_rows=' + saved_rows.length);
        console.log('lgt deleted=' + deleted.length);

        console.dir(created, { depth: 2 });

        await prisma.painelConteudoDetalhe.deleteMany({
            where: {
                id: { in: deleted.map((e) => e.id) },
            },
        });

        return {
            created: created,
            deleted: deleted,
            unchanged: unchanged,
        };
    }

    private async checkDeletedPainelConteudo(
        metas: number[],
        conteudos: PainelConteudoIdAndMeta[],
        prisma: Prisma.TransactionClient
    ): Promise<PainelConteudoIdAndMeta[]> {
        const deleted: PainelConteudoIdAndMeta[] = [];
        for (const existent_conteudo of conteudos) {
            const conteudo_kept = metas.filter((v) => {
                return v === existent_conteudo.meta_id;
            });

            if (conteudo_kept.length === 0) {
                const deleted_row = await prisma.painelConteudo.delete({
                    where: {
                        id: existent_conteudo.id,
                    },
                    select: {
                        id: true,
                        meta_id: true,
                    },
                });

                deleted.push(deleted_row);
            }
        }

        return deleted;
    }

    private async buildSeriesOrder(mostrar_planejado: boolean, mostrar_acumulado: boolean): Promise<string[]> {
        const ret: string[] = ['Realizado'];

        if (mostrar_planejado) {
            ret.push('Previsto');

            if (mostrar_acumulado) ret.push('PrevistoAcumulado');
        }

        if (mostrar_acumulado) {
            ret.push('RealizadoAcumulado');
        }

        return ret;
    }

    private async getMultiplierForPeriodicidade(periodicidade: Periodicidade): Promise<number> {
        let multiplier: number;

        switch (periodicidade) {
            case Periodicidade.Anual:
            case Periodicidade.Mensal:
                multiplier = 1;
                break;
            case Periodicidade.Bimestral:
                multiplier = 2;
                break;
            case Periodicidade.Trimestral:
                multiplier = 3;
                break;
            case Periodicidade.Quadrimestral:
                multiplier = 4;
                break;
            case Periodicidade.Quinquenal:
                multiplier = 5;
                break;
            case Periodicidade.Semestral:
                multiplier = 6;
                break;
            case Periodicidade.Secular:
                multiplier = 100;
        }

        return multiplier;
    }

    private async getStartEndDate(
        periodo: Periodo,
        periodicidade: Periodicidade,
        periodo_valor: number | null,
        periodo_inicio: Date | null,
        periodo_fim: Date | null
    ): Promise<PainelDateRange> {
        const ret: {
            start: Date;
            end: Date;
        } = {
            start: new Date(0),
            end: new Date(),
        };

        if (periodo === Periodo.Anteriores) {
            if (!periodo_valor)
                throw new BadRequestException('Faltando periodo_valor na configuração do conteúdo do painel');

            const multiplier = await this.getMultiplierForPeriodicidade(periodicidade);

            if (
                periodicidade === Periodicidade.Anual ||
                periodicidade === Periodicidade.Quinquenal ||
                periodicidade === Periodicidade.Secular
            ) {
                ret.start = new Date(new Date().getFullYear() - periodo_valor * multiplier, 0, 1);
                ret.end = new Date(new Date().getFullYear(), 0, 1);
            } else if (periodicidade === Periodicidade.Semestral) {
                const year_start_epoch = new Date(new Date().getFullYear(), 0, 1).getTime();
                const half_year_epoch = new Date(new Date().getFullYear(), 5, 1).getTime();
                const current_epoch = Date.now();

                if (current_epoch >= half_year_epoch) {
                    ret.start = new Date(half_year_epoch - 183 * 86400000 * periodo_valor);
                    ret.end = new Date(half_year_epoch);
                } else {
                    ret.start = new Date(year_start_epoch - 183 * 86400000 * periodo_valor);
                    ret.end = new Date(year_start_epoch);
                }
            } else if (periodicidade === Periodicidade.Quadrimestral) {
                const current_month = new Date().getUTCMonth();
                const current_year = new Date().getUTCFullYear();

                if (current_month <= 4) {
                    ret.start = moment(new Date(current_year, 0, 1))
                        .subtract(periodo_valor * 4, 'months')
                        .toDate();
                    ret.end = new Date(current_year, 0, 1);
                } else if (current_month > 4 && current_month <= 8) {
                    ret.start = moment(new Date(current_year, 4, 1))
                        .subtract(periodo_valor * 4, 'months')
                        .toDate();
                    ret.end = new Date(current_year, 4, 1);
                } else {
                    ret.start = moment(new Date(current_year, 8, 1))
                        .subtract(periodo_valor * 4, 'months')
                        .toDate();
                    ret.end = new Date(current_year, 11, 31);
                }
            } else if (periodicidade === Periodicidade.Trimestral) {
                ret.start = DateTime.now().minus({ quarter: periodo_valor }).startOf('quarter').toJSDate();
                ret.end = DateTime.now().startOf('quarter').toJSDate();
            } else if (periodicidade === Periodicidade.Bimestral) {
                const current_month = new Date().getUTCMonth();
                const current_year = new Date().getUTCFullYear();

                if (current_month % 2) {
                    ret.start = moment(new Date(current_year, current_month - 1, 1))
                        .subtract(periodo_valor * 2, 'months')
                        .toDate();
                    ret.end = new Date(current_year, current_month, 31);
                } else {
                    ret.start = moment(new Date(current_year, current_month - 2, 1))
                        .subtract(periodo_valor * 2, 'months')
                        .toDate();
                    ret.end = new Date(current_year, current_month - 1, 31);
                }
            } else if (periodicidade === Periodicidade.Mensal) {
                ret.start = DateTime.now().startOf('month').minus({ months: periodo_valor }).toJSDate();
                ret.end = DateTime.now().startOf('month').minus({ day: 1 }).toJSDate();
            } else {
                throw new BadRequestException('faltando tratamento para periodicidade: ' + periodicidade);
            }
        } else if (periodo === Periodo.EntreDatas) {
            if (!periodo_inicio || !periodo_fim) throw new BadRequestException('Faltando configuração de periodos');

            ret.start = periodo_inicio;
            ret.end = periodo_fim;
        } else {
            ret.start = new Date(0);
            ret.end = new Date();
        }

        return ret;
    }

    private async getTitle(periodicidade: Periodicidade, start: DateTime, end: DateTime): Promise<string> {
        let ret: string;

        if (
            periodicidade === Periodicidade.Semestral ||
            periodicidade === Periodicidade.Trimestral ||
            periodicidade === Periodicidade.Quadrimestral ||
            periodicidade === Periodicidade.Bimestral
        ) {
            const date = end.minus({ second: 1 });

            ret = date.toLocaleString({ month: '2-digit', year: 'numeric' });
        } else if (
            periodicidade === Periodicidade.Secular ||
            periodicidade === Periodicidade.Quinquenal ||
            periodicidade === Periodicidade.Anual
        ) {
            ret = start.toLocaleString({ year: 'numeric' });
        } else {
            ret = start.toLocaleString({ month: '2-digit', year: 'numeric' });
        }

        return ret;
    }

    private async getSeriesTemplate(
        periodicidade: Periodicidade,
        periodo_valor: number | null,
        start_date: Date,
        end_date: Date,
        series_order_size: number
    ): Promise<SeriesTemplate[]> {
        const series_template: SeriesTemplate[] = [];

        const config: {
            time_unit: string | null;
            multiplier: number | null;
        } = {
            time_unit: null,
            multiplier: null,
        };

        switch (periodicidade) {
            case Periodicidade.Secular:
                config.time_unit = 'years';
                config.multiplier = 100;
                break;
            case Periodicidade.Quinquenal:
                config.time_unit = 'years';
                config.multiplier = 5;
                break;
            case Periodicidade.Anual:
                config.time_unit = 'years';
                config.multiplier = 1;
                break;
            case Periodicidade.Semestral:
                config.time_unit = 'quarter';
                config.multiplier = 2;
                break;
            case Periodicidade.Quadrimestral:
                config.time_unit = 'months';
                config.multiplier = 4;
                break;
            case Periodicidade.Trimestral:
                config.time_unit = 'months';
                config.multiplier = 3;
                break;
            case Periodicidade.Bimestral:
                config.time_unit = 'months';
                config.multiplier = 2;
                break;
            case Periodicidade.Mensal:
                config.time_unit = 'months';
                config.multiplier = 1;
        }

        if (!config.multiplier || !config.time_unit)
            throw new BadRequestException(
                'Faltando tratamento para configuração do painel, na geração de janelas de tempo'
            );

        if (!periodo_valor) periodo_valor = 1;

        const empty_values: (number | '' | Decimal)[] = [];
        while (empty_values.length < series_order_size) {
            empty_values.push('');
        }

        const start = DateTime.fromJSDate(start_date).setLocale('pt-BR');
        const end = DateTime.fromJSDate(end_date).setLocale('pt-BR');

        let window_start: DateTime = start;
        let window_end: DateTime | null = null;

        while (window_start < end) {
            if (periodicidade === Periodicidade.Semestral) {
                window_start = window_end
                    ? window_start.plus({ quarter: 1 }).startOf('quarter')
                    : window_start.startOf('quarter');
                window_end = window_start.plus({ quarters: 1 }).endOf('quarter');
            } else {
                // Objeto que é utilizado para soma no Luxon (ex: {days: 10}).
                const plus_obj: any = {};
                plus_obj[config.time_unit] = config.multiplier;

                window_end = window_start.plus(plus_obj);
            }

            series_template.push({
                titulo: await this.getTitle(periodicidade, window_start, window_end),
                periodo_inicio: window_start.toJSDate(),
                periodo_fim: window_end.minus({ second: 1 }).toJSDate(),
                valores_nominais: empty_values,
            });

            window_start = window_end;
        }

        return series_template;
    }

    async getPainelConteudoSerie(painel_conteudo_id: number): Promise<PainelConteudoSerie> {
        let ret = <PainelConteudoSerie>{};
        const config = await this.getPainelConteudoVisualizacao(painel_conteudo_id);

        let series_template: SeriesTemplate[] = [];
        let gte;
        let lte;

        const series_order = await this.buildSeriesOrder(config.mostrar_planejado, config.mostrar_acumulado);

        if (config.periodo === Periodo.Anteriores) {
            if (!config.periodo_valor)
                throw new BadRequestException('Faltando periodo_valor na configuração do conteúdo do painel');

            const date_range = await this.getStartEndDate(
                config.periodo,
                config.periodicidade,
                config.periodo_valor,
                config.periodo_fim,
                config.periodo_fim
            );
            gte = date_range.start;
            lte = date_range.end;

            series_template = await this.getSeriesTemplate(
                config.periodicidade,
                config.periodo_valor,
                gte,
                lte,
                series_order.length
            );
        } else if (config.periodo === Periodo.EntreDatas) {
            if (!config.periodo_inicio || !config.periodo_fim)
                throw new BadRequestException('Faltando configuração de periodos');

            gte = config.periodo_inicio;
            lte = config.periodo_fim;

            series_template = await this.getSeriesTemplate(
                config.periodicidade,
                config.periodo_valor,
                gte,
                lte,
                series_order.length
            );
        } else {
            gte = new Date(0);
            lte = new Date();
        }

        const series = await this.prisma.painelConteudo.findFirstOrThrow({
            where: { id: painel_conteudo_id },
            select: {
                mostrar_acumulado: true,
                mostrar_acumulado_periodo: true,
                mostrar_indicador: true,
                mostrar_planejado: true,

                meta: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,

                        indicador: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,

                                SerieIndicador: {
                                    where: {
                                        data_valor: {
                                            gte: gte,
                                            lte: lte,
                                        },
                                        ha_conferencia_pendente: false,
                                    },
                                    orderBy: { data_valor: 'desc' },
                                    select: {
                                        serie: true,
                                        data_valor: true,
                                        valor_nominal: true,
                                    },
                                },
                            },
                        },
                    },
                },

                detalhes: {
                    where: {
                        mostrar_indicador: true,
                        pai_id: null,
                    },
                    orderBy: [{ ordem: 'asc' }],
                    select: {
                        variavel: {
                            select: {
                                id: true,
                                titulo: true,
                                serie_variavel: {
                                    where: {
                                        data_valor: {
                                            gte: gte,
                                            lte: lte,
                                        },
                                        conferida: true,
                                    },
                                    orderBy: { data_valor: 'desc' },
                                    select: {
                                        serie: true,
                                        data_valor: true,
                                        valor_nominal: true,
                                    },
                                },
                            },
                        },
                        iniciativa: {
                            select: {
                                id: true,
                                titulo: true,

                                Indicador: {
                                    where: { removido_em: null },
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,

                                        SerieIndicador: {
                                            where: {
                                                data_valor: {
                                                    gte: gte,
                                                    lte: lte,
                                                },
                                                ha_conferencia_pendente: false,
                                            },
                                            orderBy: { data_valor: 'desc' },
                                            select: {
                                                serie: true,
                                                data_valor: true,
                                                valor_nominal: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        filhos: {
                            where: { mostrar_indicador: true },
                            select: {
                                variavel: {
                                    select: {
                                        id: true,
                                        titulo: true,

                                        serie_variavel: {
                                            where: {
                                                data_valor: {
                                                    gte: gte,
                                                    lte: lte,
                                                },
                                                conferida: true,
                                            },
                                            orderBy: { data_valor: 'desc' },
                                            select: {
                                                serie: true,
                                                data_valor: true,
                                                valor_nominal: true,
                                            },
                                        },
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,

                                        Indicador: {
                                            where: { removido_em: null },
                                            select: {
                                                id: true,
                                                codigo: true,
                                                titulo: true,

                                                SerieIndicador: {
                                                    where: {
                                                        data_valor: {
                                                            gte: gte,
                                                            lte: lte,
                                                        },
                                                        ha_conferencia_pendente: false,
                                                    },
                                                    orderBy: { data_valor: 'desc' },
                                                    select: {
                                                        serie: true,
                                                        data_valor: true,
                                                        valor_nominal: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                filhos: {
                                    where: { mostrar_indicador: true },
                                    select: {
                                        variavel: {
                                            select: {
                                                id: true,
                                                titulo: true,

                                                serie_variavel: {
                                                    where: {
                                                        data_valor: {
                                                            gte: gte,
                                                            lte: lte,
                                                        },
                                                        conferida: true,
                                                    },
                                                    orderBy: { data_valor: 'desc' },
                                                    select: {
                                                        serie: true,
                                                        data_valor: true,
                                                        valor_nominal: true,
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
            },
        });

        if (config.periodo === Periodo.Todos) {
            const all_series: SerieRow[] = [];

            series.meta.indicador.forEach((r) => {
                r.SerieIndicador.forEach((s) => {
                    all_series.push(s);
                });
            });

            series.detalhes.forEach((d) => {
                d.variavel?.serie_variavel.forEach((s) => {
                    all_series.push(s);
                });

                d.iniciativa?.Indicador.forEach((i) => {
                    i.SerieIndicador.forEach((s) => {
                        all_series.push(s);
                    });
                });

                d.filhos.forEach((f) => {
                    f.atividade?.Indicador.forEach((i) => {
                        i.SerieIndicador.forEach((s) => {
                            all_series.push(s);
                        });
                    });

                    f.variavel?.serie_variavel.forEach((s) => {
                        all_series.push(s);
                    });

                    f.filhos.forEach((ff) => {
                        ff.variavel?.serie_variavel.forEach((s) => {
                            all_series.push(s);
                        });
                    });
                });
            });

            if (all_series.length > 0) {
                all_series.sort(function compare(a, b) {
                    const date_a = new Date(a.data_valor).getTime();
                    const date_b = new Date(b.data_valor).getTime();
                    return date_a - date_b;
                });

                const earliest = new Date(all_series[0].data_valor);
                const latest = new Date(all_series.at(-1)!.data_valor);

                series_template = await this.getSeriesTemplate(
                    config.periodicidade,
                    null,
                    earliest,
                    latest,
                    series_order.length
                );
            }
        }

        ret = {
            mostrar_acumulado: series.mostrar_acumulado,
            mostrar_acumulado_periodo: series.mostrar_acumulado_periodo,
            mostrar_indicador: series.mostrar_indicador,
            mostrar_planejado: series.mostrar_planejado,
            meta: {
                id: series.meta.id,
                titulo: series.meta.titulo,
                codigo: series.meta.codigo,

                indicador:
                    series.mostrar_indicador && series.meta.indicador.length > 0
                        ? {
                              id: series.meta.indicador[0].id,
                              codigo: series.meta.indicador[0].codigo,
                              titulo: series.meta.indicador[0].titulo,

                              series: series_template.map((t) => {
                                  const series_for_period = series.meta.indicador[0].SerieIndicador.filter((r) => {
                                      return (
                                          r.data_valor.getTime() >= t.periodo_inicio.getTime() &&
                                          r.data_valor.getTime() <= t.periodo_fim.getTime()
                                      );
                                  });

                                  return {
                                      titulo: t.titulo,
                                      periodo_inicio: t.periodo_inicio,
                                      periodo_fim: t.periodo_fim,

                                      valores_nominais: t.valores_nominais.map((vn, ix) => {
                                          const serie_match_arr = series_for_period.filter((sm) => {
                                              return sm.serie == series_order[ix];
                                          });
                                          const serie_match = serie_match_arr[0];

                                          if (serie_match) {
                                              return serie_match.valor_nominal;
                                          } else {
                                              return '';
                                          }
                                      }),
                                  };
                              }),
                          }
                        : {},
            },

            detalhes: series.detalhes.map((d) => {
                return {
                    variavel: {
                        id: d.variavel?.id,
                        titulo: d.variavel?.titulo,

                        series: series_template.map((t) => {
                            const series_for_period =
                                d.variavel?.serie_variavel.filter((r) => {
                                    return (
                                        r.data_valor.getTime() >= t.periodo_inicio.getTime() &&
                                        r.data_valor.getTime() <= t.periodo_fim.getTime()
                                    );
                                }) || [];

                            return {
                                titulo: t.titulo,
                                periodo_inicio: t.periodo_inicio,
                                periodo_fim: t.periodo_fim,
                                valores_nominais: t.valores_nominais.map((vn, ix) => {
                                    const serie_match_arr = series_for_period.filter((sm) => {
                                        return sm.serie == series_order[ix];
                                    });
                                    const serie_match = serie_match_arr[0];

                                    if (serie_match) {
                                        return serie_match.valor_nominal;
                                    } else {
                                        return '';
                                    }
                                }),
                            };
                        }),
                    },

                    iniciativa: {
                        id: d.iniciativa?.id,
                        titulo: d.iniciativa?.titulo,

                        indicador: d.iniciativa?.Indicador.map((i) => {
                            return {
                                id: i.id,
                                codigo: i.codigo,
                                titulo: i.titulo,

                                series: series_template.map((t) => {
                                    const series_for_period =
                                        i.SerieIndicador.filter((r) => {
                                            return (
                                                r.data_valor.getTime() >= t.periodo_inicio.getTime() &&
                                                r.data_valor.getTime() <= t.periodo_fim.getTime()
                                            );
                                        }) || [];

                                    return {
                                        titulo: t.titulo,
                                        periodo_inicio: t.periodo_inicio,
                                        periodo_fim: t.periodo_fim,
                                        valores_nominais: t.valores_nominais.map((vn, ix) => {
                                            const serie_match_arr = series_for_period.filter((sm) => {
                                                return sm.serie == series_order[ix];
                                            });
                                            const serie_match = serie_match_arr[0];

                                            if (serie_match) {
                                                return serie_match.valor_nominal;
                                            } else {
                                                return '';
                                            }
                                        }),
                                    };
                                }),
                            };
                        }),
                    },

                    filhos: d.filhos.map((f) => {
                        return {
                            variavel: {
                                id: f.variavel?.id,
                                titulo: f.variavel?.titulo,
                                series: series_template.map((t) => {
                                    const series_for_period =
                                        f.variavel?.serie_variavel.filter((r) => {
                                            return (
                                                r.data_valor.getTime() >= t.periodo_inicio.getTime() &&
                                                r.data_valor.getTime() <= t.periodo_fim.getTime()
                                            );
                                        }) || [];

                                    return {
                                        titulo: t.titulo,
                                        periodo_inicio: t.periodo_inicio,
                                        periodo_fim: t.periodo_fim,
                                        valores_nominais: t.valores_nominais.map((vn, ix) => {
                                            const serie_match_arr = series_for_period.filter((sm) => {
                                                return sm.serie == series_order[ix];
                                            });
                                            const serie_match = serie_match_arr[0];

                                            if (serie_match) {
                                                return serie_match.valor_nominal;
                                            } else {
                                                return '';
                                            }
                                        }),
                                    };
                                }),
                            },

                            atividade: {
                                id: f.atividade?.id,
                                titulo: f.atividade?.titulo,

                                indicador: f.atividade?.Indicador.map((i) => {
                                    return {
                                        id: i.id,
                                        codigo: i.codigo,
                                        titulo: i.titulo,

                                        series: series_template.map((t) => {
                                            const series_for_period =
                                                i.SerieIndicador.filter((r) => {
                                                    return (
                                                        r.data_valor.getTime() >= t.periodo_inicio.getTime() &&
                                                        r.data_valor.getTime() <= t.periodo_fim.getTime()
                                                    );
                                                }) || [];

                                            return {
                                                titulo: t.titulo,
                                                periodo_inicio: t.periodo_inicio,
                                                periodo_fim: t.periodo_fim,
                                                valores_nominais: t.valores_nominais.map((vn, ix) => {
                                                    const serie_match_arr = series_for_period.filter((sm) => {
                                                        return sm.serie == series_order[ix];
                                                    });
                                                    const serie_match = serie_match_arr[0];

                                                    if (serie_match) {
                                                        return serie_match.valor_nominal;
                                                    } else {
                                                        return '';
                                                    }
                                                }),
                                            };
                                        }),
                                    };
                                }),
                            },

                            filhos: f.filhos.map((af) => {
                                return {
                                    variavel: {
                                        id: af.variavel?.id,
                                        titulo: af.variavel?.titulo,

                                        series: series_template.map((t) => {
                                            const series_for_period =
                                                af.variavel?.serie_variavel.filter((r) => {
                                                    return (
                                                        r.data_valor.getTime() >= t.periodo_inicio.getTime() &&
                                                        r.data_valor.getTime() <= t.periodo_fim.getTime()
                                                    );
                                                }) || [];

                                            return {
                                                titulo: t.titulo,
                                                periodo_inicio: t.periodo_inicio,
                                                periodo_fim: t.periodo_fim,
                                                valores_nominais: t.valores_nominais.map((vn, ix) => {
                                                    const serie_match_arr = series_for_period.filter((sm) => {
                                                        return sm.serie == series_order[ix];
                                                    });
                                                    const serie_match = serie_match_arr[0];

                                                    if (serie_match) {
                                                        return serie_match.valor_nominal;
                                                    } else {
                                                        return '';
                                                    }
                                                }),
                                            };
                                        }),
                                    },
                                };
                            }),
                        };
                    }),
                };
            }),

            ordem_series: series_order,
        };

        return ret;
    }

    async getSimplifiedPainelSeries(opts: {
        painel_id: number;
        metas_ids: number[];
    }): Promise<SimplifiedPainelConteudoSeries[]> {
        interface values {
            [key: string]: number | Decimal | '';
        }

        class RetMeta {
            meta_id: number;
            meta_codigo: string;
            meta_titulo: string;
        }

        class RetIniciativa {
            iniciativa_id?: number | null;
            iniciativa_codigo?: string | null;
            iniciativa_titulo?: string | null;
        }

        class RetAtividade {
            atividade_id?: number | null;
            atividade_codigo?: string | null;
            atividade_titulo?: string | null;
        }

        const painel_conteudo_db = await this.prisma.painelConteudo.findMany({
            where: {
                painel_id: opts.painel_id,
                meta_id: { in: opts.metas_ids },
            },
            select: {
                id: true,
            },
        });

        const ret: SimplifiedPainelConteudoSeries[] = [];

        for (const painel_conteudo of painel_conteudo_db) {
            const painel_conteudo_series = await this.getPainelConteudoSerie(painel_conteudo.id);

            const series_order = painel_conteudo_series.ordem_series;

            const painel_conteudo_meta: RetMeta = {
                meta_id: painel_conteudo_series.meta.id,
                meta_codigo: painel_conteudo_series.meta.codigo,
                meta_titulo: painel_conteudo_series.meta.titulo,
            };

            if (painel_conteudo_series.meta.indicador) {
                ret.push({
                    ...painel_conteudo_meta,

                    indicador_id: painel_conteudo_series.meta.indicador.id,
                    indicador_codigo: painel_conteudo_series.meta.indicador.codigo,
                    indicador_titulo: painel_conteudo_series.meta.indicador.titulo,
                    series: painel_conteudo_series.meta.indicador.series?.map((s) => {
                        const values: values = {};
                        s.valores_nominais.forEach((vn, i) => {
                            values[series_order[i]] = vn;
                        });

                        return {
                            data: s.titulo,
                            ...values,
                        };
                    }),
                });
            }

            painel_conteudo_series.detalhes?.forEach((d) => {
                const iniciativa: RetIniciativa = {
                    iniciativa_id: d.iniciativa ? d.iniciativa.id : null,
                    iniciativa_codigo: d.iniciativa ? d.iniciativa.codigo : null,
                    iniciativa_titulo: d.iniciativa ? d.iniciativa.titulo : null,
                };

                if (d.variavel?.series && d.variavel?.series?.length > 0) {
                    ret.push({
                        ...painel_conteudo_meta,
                        ...iniciativa,

                        variavel_id: d.variavel.id,
                        variavel_codigo: d.variavel.codigo,
                        variavel_titulo: d.variavel.titulo,
                        series: d.variavel.series.map((s) => {
                            const values: values = {};
                            s.valores_nominais.forEach((vn, i) => {
                                values[series_order[i]] = vn;
                            });

                            return {
                                data: s.titulo,
                                ...values,
                            };
                        }),
                    });
                }

                if (d.iniciativa?.indicador) {
                    d.iniciativa.indicador.forEach((ii) => {
                        if (ii.series && ii.series.length > 0) {
                            ret.push({
                                ...painel_conteudo_meta,
                                ...iniciativa,
                                indicador_id: ii.id,
                                indicador_codigo: ii.codigo,
                                indicador_titulo: ii.titulo,
                                series: ii.series.map((s) => {
                                    const values: values = {};
                                    s.valores_nominais.forEach((vn, i) => {
                                        values[series_order[i]] = vn;
                                    });

                                    return {
                                        data: s.titulo,
                                        ...values,
                                    };
                                }),
                            });
                        }
                    });
                }

                d.filhos?.forEach((f) => {
                    const atividade: RetAtividade = {
                        atividade_id: f.atividade ? f.atividade.id : null,
                        atividade_codigo: f.atividade ? f.atividade.codigo : null,
                        atividade_titulo: f.atividade ? f.atividade.titulo : null,
                    };

                    if (f.variavel?.series && f.variavel?.series?.length > 0) {
                        ret.push({
                            ...painel_conteudo_meta,
                            ...iniciativa,
                            ...atividade,
                            variavel_id: f.variavel.id,
                            variavel_codigo: f.variavel.codigo,
                            variavel_titulo: f.variavel.titulo,
                            series: f.variavel.series.map((s) => {
                                const values: values = {};
                                s.valores_nominais.forEach((vn, i) => {
                                    values[series_order[i]] = vn;
                                });

                                return {
                                    data: s.titulo,
                                    ...values,
                                };
                            }),
                        });
                    }

                    if (f.atividade?.indicador) {
                        f.atividade.indicador.forEach((ai) => {
                            if (ai.series && ai.series.length > 0) {
                                ret.push({
                                    ...painel_conteudo_meta,
                                    ...iniciativa,
                                    ...atividade,
                                    indicador_id: ai.id,
                                    indicador_codigo: ai.codigo,
                                    indicador_titulo: ai.titulo,
                                    series: ai.series.map((s) => {
                                        const values: values = {};
                                        s.valores_nominais.forEach((vn, i) => {
                                            values[series_order[i]] = vn;
                                        });

                                        return {
                                            data: s.titulo,
                                            ...values,
                                        };
                                    }),
                                });
                            }
                        });
                    }

                    d.filhos?.forEach((ff) => {
                        const atividade: RetAtividade = {
                            atividade_id: ff.atividade ? ff.atividade.id : null,
                            atividade_codigo: ff.atividade ? ff.atividade.codigo : null,
                            atividade_titulo: ff.atividade ? ff.atividade.titulo : null,
                        };

                        if (ff.variavel?.series && ff.variavel?.series?.length > 0) {
                            ret.push({
                                ...painel_conteudo_meta,
                                ...iniciativa,
                                ...atividade,
                                variavel_id: ff.variavel.id,
                                variavel_codigo: ff.variavel.codigo,
                                variavel_titulo: ff.variavel.titulo,
                                series: ff.variavel.series.map((s) => {
                                    const values: values = {};
                                    s.valores_nominais.forEach((vn, i) => {
                                        values[series_order[i]] = vn;
                                    });

                                    return {
                                        data: s.titulo,
                                        ...values,
                                    };
                                }),
                            });
                        }

                        if (ff.atividade?.indicador) {
                            ff.atividade.indicador.forEach((ai) => {
                                if (ai.series && ai.series.length > 0) {
                                    ret.push({
                                        ...painel_conteudo_meta,
                                        ...iniciativa,
                                        ...atividade,
                                        indicador_id: ai.id,
                                        indicador_codigo: ai.codigo,
                                        indicador_titulo: ai.titulo,
                                        series: ai.series.map((s) => {
                                            const values: values = {};
                                            s.valores_nominais.forEach((vn, i) => {
                                                values[series_order[i]] = vn;
                                            });

                                            return {
                                                data: s.titulo,
                                                ...values,
                                            };
                                        }),
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }

        return ret;
    }
}
