import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { PessoaPrivilegioService } from '../auth/pessoaPrivilegio.service';

@Injectable()
export class PessoaResponsabilidadesMetaService {
    constructor(private readonly pessoaPrivService: PessoaPrivilegioService) {}

    async buscaMetas(origemId: number, pdmId: number | undefined, prismaTx: Prisma.TransactionClient) {
        // a ideia é 'pecar' pelo excesso, pois os sistema pode estar com o banco
        // sujo, ou seja, ter uma pessoa atribuída no filho mas não estar atribuída corretamente na meta
        // nesse caso, na migração, a meta seria ajustada até o nivel necessário
        const somePessoa = { some: { pessoa_id: origemId } } as const;
        const rows = await prismaTx.meta.findMany({
            where: {
                removido_em: null,
                pdm_id: pdmId,
                OR: [
                    // responsavel na meta
                    { meta_responsavel: somePessoa },

                    // responsavel na iniciativa
                    {
                        iniciativa: {
                            some: {
                                removido_em: null,
                                iniciativa_responsavel: somePessoa,
                            },
                        },
                    },
                    // responsavel na atividade
                    {
                        iniciativa: {
                            some: {
                                removido_em: null,
                                atividade: {
                                    some: { atividade_responsavel: somePessoa },
                                },
                            },
                        },
                    },

                    // responsavel em variavel do indicador da meta
                    {
                        indicador: {
                            some: {
                                removido_em: null,
                                IndicadorVariavel: {
                                    some: {
                                        desativado_em: null,
                                        variavel: {
                                            removido_em: null,
                                            variavel_responsavel: somePessoa,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    // responsavel em variavel do indicador da iniciativa
                    {
                        iniciativa: {
                            some: {
                                removido_em: null,
                                Indicador: {
                                    some: {
                                        removido_em: null,
                                        IndicadorVariavel: {
                                            some: {
                                                desativado_em: null,
                                                variavel: {
                                                    removido_em: null,
                                                    variavel_responsavel: somePessoa,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    // responsavel em variavel do indicador da atividade
                    {
                        iniciativa: {
                            some: {
                                removido_em: null,
                                atividade: {
                                    some: {
                                        Indicador: {
                                            some: {
                                                removido_em: null,
                                                IndicadorVariavel: {
                                                    some: {
                                                        desativado_em: null,
                                                        variavel: {
                                                            removido_em: null,
                                                            variavel_responsavel: somePessoa,
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

                    // cronograma da meta
                    {
                        cronograma: {
                            some: {
                                removido_em: null,
                                CronogramaEtapa: {
                                    some: {
                                        inativo: undefined, // conferir com o Lucas/FGV
                                        etapa: {
                                            removido_em: null,
                                            responsaveis: somePessoa,
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // cronograma da iniciativa
                    {
                        iniciativa: {
                            some: {
                                removido_em: null,
                                Cronograma: {
                                    some: {
                                        removido_em: null,
                                        CronogramaEtapa: {
                                            some: {
                                                inativo: undefined, // conferir com o Lucas/FGV
                                                etapa: {
                                                    removido_em: null,
                                                    responsaveis: somePessoa,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },

                    // cronograma da atividade
                    {
                        iniciativa: {
                            some: {
                                removido_em: null,
                                atividade: {
                                    some: {
                                        removido_em: null,
                                        Cronograma: {
                                            some: {
                                                removido_em: null,
                                                CronogramaEtapa: {
                                                    some: {
                                                        inativo: undefined, // conferir com o Lucas/FGV
                                                        etapa: {
                                                            removido_em: null,
                                                            responsaveis: somePessoa,
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
                ],
            },
            select: {
                id: true,
                codigo: true,
                titulo: true,
            },
        });
        return rows;
    }

    async copiarResponsabilidades(
        origemId: number,
        destinoId: number,
        metas: number[],
        prismaTx: Prisma.TransactionClient,
        user: PessoaFromJwt
    ): Promise<void> {
        const logger = LoggerWithLog('PessoaResponsabilidadesMetaService: copiarResponsabilidades');
        const metasInIds = { in: metas } as const;

        const disclaimerStr = 'pois não destino não tem permissão de coordenador CP';

        const pComPriv = await this.pessoaPrivService.pessoasComPriv(['PDM.coordenador_responsavel_cp'], [destinoId]);

        const destinoEhCoordenadorCp = pComPriv.length > 0;
        // Meta Responsavel + Responsável CP
        {
            const origMetaResponsavelRows = await prismaTx.metaResponsavel.findMany({
                where: {
                    meta_id: metasInIds,
                    pessoa_id: origemId,
                },
            });

            for (const mr of origMetaResponsavelRows) {
                if (mr.coordenador_responsavel_cp && !destinoEhCoordenadorCp) {
                    logger.warn(
                        `Desativando cópia na metaResponsavel de ${origemId} para ${destinoId}, meta_id ${mr.meta_id} ${disclaimerStr}`
                    );
                    continue;
                }

                logger.verbose(
                    `Copiando/atualizando metaResponsavel de ${origemId} para ${destinoId}, meta_id ${mr.meta_id}, coordenador_responsavel_cp=${mr.coordenador_responsavel_cp}`
                );

                await prismaTx.metaResponsavel.upsert({
                    where: {
                        pessoa_id_meta_id_coordenador_responsavel_cp: {
                            pessoa_id: destinoId,
                            meta_id: mr.meta_id,
                            coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                        },
                    },
                    create: {
                        coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                        orgao_id: mr.orgao_id,
                        pessoa_id: destinoId,
                        meta_id: mr.meta_id,
                    },
                    update: {},
                });
            }
        }

        const iniciativasAtividades = await prismaTx.iniciativa.findMany({
            where: {
                meta_id: metasInIds,
                removido_em: null,
            },
            select: {
                id: true,
                atividade: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true },
                },
            },
        });
        const iniInIds = { in: iniciativasAtividades.map((r) => r.id) } as const;
        const atvInIds = { in: iniciativasAtividades.flatMap((r) => r.atividade).map((a) => a.id) } as const;

        // Iniciativa Responsavel + Responsável CP
        {
            const iniciativaResponsavelRows = await prismaTx.iniciativaResponsavel.findMany({
                where: {
                    iniciativa_id: iniInIds,
                    pessoa_id: origemId,
                },
            });

            for (const mr of iniciativaResponsavelRows) {
                if (mr.coordenador_responsavel_cp != destinoEhCoordenadorCp) {
                    logger.warn(
                        `Desativando cópia na iniciativaResponsavel de ${origemId} para ${destinoId}, iniciativa_id ${mr.iniciativa_id} ${disclaimerStr}`
                    );
                    continue;
                }

                logger.verbose(
                    `Copiando/Atualizando iniciativaResponsavel de ${origemId} para ${destinoId}, iniciativa_id ${mr.iniciativa_id}, coordenador_responsavel_cp=${mr.coordenador_responsavel_cp}`
                );

                await prismaTx.iniciativaResponsavel.upsert({
                    where: {
                        pessoa_id_iniciativa_id_coordenador_responsavel_cp: {
                            pessoa_id: destinoId,
                            iniciativa_id: mr.iniciativa_id,
                            coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                        },
                    },
                    create: {
                        orgao_id: mr.orgao_id,
                        pessoa_id: destinoId,
                        iniciativa_id: mr.iniciativa_id,
                        coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                    },
                    update: {},
                });
            }
        }

        // Atividade Responsavel + Responsável CP
        {
            const atividadeResponsavelRows = await prismaTx.atividadeResponsavel.findMany({
                where: {
                    atividade_id: atvInIds,
                    pessoa_id: origemId,
                },
            });

            for (const mr of atividadeResponsavelRows) {
                if (mr.coordenador_responsavel_cp && !destinoEhCoordenadorCp) {
                    logger.warn(
                        `Desativando cópia de atividadeResponsavel de ${origemId} para ${destinoId}, atividade_id ${mr.atividade_id} ${disclaimerStr}`
                    );
                    continue;
                }

                logger.verbose(
                    `Copiando atividadeResponsavel de ${origemId} para ${destinoId}, atividade_id ${mr.atividade_id}, coordenador_responsavel_cp=${mr.coordenador_responsavel_cp}`
                );

                await prismaTx.atividadeResponsavel.upsert({
                    where: {
                        pessoa_id_atividade_id_coordenador_responsavel_cp: {
                            pessoa_id: destinoId,
                            atividade_id: mr.atividade_id,
                            coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                        },
                    },
                    create: {
                        coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                        orgao_id: mr.orgao_id,
                        pessoa_id: destinoId,
                        atividade_id: mr.atividade_id,
                    },
                    update: {},
                });
            }
        }

        // Variavel do indicador da Meta/Iniciativa/Atividade
        {
            const destinoRows = await prismaTx.variavelResponsavel.findMany({
                where: {
                    variavel: {
                        indicador_variavel: {
                            some: {
                                desativado_em: null,
                                indicador_origem: null,
                                indicador: {
                                    OR: [
                                        { meta_id: metasInIds },
                                        { iniciativa_id: iniInIds },
                                        { atividade_id: atvInIds },
                                    ],
                                },
                            },
                        },
                    },
                    pessoa_id: destinoId,
                },
            });

            const variavelResponsavelRows = await prismaTx.variavelResponsavel.findMany({
                where: {
                    variavel: {
                        indicador_variavel: {
                            some: {
                                desativado_em: null,
                                indicador_origem: null,
                                indicador: {
                                    OR: [
                                        { meta_id: metasInIds },
                                        { iniciativa_id: iniInIds },
                                        { atividade_id: atvInIds },
                                    ],
                                },
                            },
                        },
                    },
                    pessoa_id: origemId,
                },
                include: {
                    variavel: {
                        select: {
                            indicador_variavel: {
                                where: {
                                    desativado_em: null,
                                    indicador_origem: null,
                                },
                                select: {
                                    indicador: {
                                        select: {
                                            meta_id: true,
                                            iniciativa_id: true,
                                            atividade_id: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const mrInput: Prisma.VariavelResponsavelCreateManyInput[] = [];
            for (const mr of variavelResponsavelRows) {
                const varExists = destinoRows.find((r) => r.variavel_id == mr.variavel_id);

                if (varExists) {
                    logger.verbose(
                        `variavelResponsavel destino ${destinoId} já tem variavel ${JSON.stringify(mr.variavel)}`
                    );
                    continue;
                }

                logger.verbose(
                    `Copiando variavelResponsavel de ${origemId} para ${destinoId}, variavel ${JSON.stringify(mr.variavel)}`
                );
                mrInput.push({
                    variavel_id: mr.variavel_id,
                    pessoa_id: destinoId,
                });
            }
            await prismaTx.variavelResponsavel.createMany({ data: mrInput });
        }

        // Cronograma da meta/iniciativa/atividade
        {
            const destinoRows = await prismaTx.etapaResponsavel.findMany({
                where: {
                    pessoa_id: origemId,
                    etapa: {
                        cronograma: {
                            removido_em: null,

                            OR: [{ meta_id: metasInIds }, { iniciativa_id: iniInIds }, { atividade_id: atvInIds }],
                        },
                    },
                },
            });

            const variavelResponsavelRows = await prismaTx.etapaResponsavel.findMany({
                where: {
                    pessoa_id: origemId,
                    etapa: {
                        cronograma: {
                            removido_em: null,

                            OR: [{ meta_id: metasInIds }, { iniciativa_id: iniInIds }, { atividade_id: atvInIds }],
                        },
                    },
                },
                include: {
                    etapa: {
                        select: {
                            cronograma: {
                                select: {
                                    meta_id: true,
                                    iniciativa_id: true,
                                    atividade_id: true,
                                },
                            },
                        },
                    },
                },
            });
            const mrInput: Prisma.EtapaResponsavelCreateManyInput[] = [];
            for (const mr of variavelResponsavelRows) {
                const varExists = destinoRows.find((r) => r.etapa_id == mr.etapa_id);

                if (varExists) {
                    logger.verbose(`etapaResponsavel destino ${destinoId} já tem etapa ${JSON.stringify(mr.etapa)}`);
                    continue;
                }

                logger.verbose(
                    `Copiando etapaResponsavel de ${origemId} para ${destinoId}, etapa ${JSON.stringify(mr.etapa)}`
                );
                mrInput.push({
                    etapa_id: mr.etapa_id,
                    pessoa_id: destinoId,
                });
            }
            await prismaTx.etapaResponsavel.createMany({ data: mrInput });
        }

        await logger.saveLogs(prismaTx, user.getLogData());

        return;
    }

    // TODO não deixar ficar com o responsáveis vazios depois de removido, tem que dar rollback.
    async removerResponsabilidades(
        pessoaId: number,
        metas: number[],
        prismaTx: Prisma.TransactionClient,
        user: PessoaFromJwt
    ): Promise<void> {
        const logger = LoggerWithLog('PessoaResponsabilidadesMetaService: removerResponsabilidades');
        const metasInIds = { in: metas } as const;

        // Meta Responsavel + Responsável CP
        {
            const metaResponsavelRows = await prismaTx.metaResponsavel.findMany({
                where: {
                    meta_id: metasInIds,
                    pessoa_id: pessoaId,
                },
            });
            const mrIds: number[] = [];
            for (const mr of metaResponsavelRows) {
                logger.verbose(
                    `Removendo metaResponsavel de ${pessoaId} meta ${mr.meta_id}, coordenador_responsavel_cp=${mr.coordenador_responsavel_cp}`
                );
                mrIds.push(mr.id);
            }
            await prismaTx.metaResponsavel.deleteMany({ where: { id: { in: mrIds } } });
        }

        const iniciativasAtividades = await prismaTx.iniciativa.findMany({
            where: {
                meta_id: metasInIds,
                removido_em: null,
            },
            select: {
                id: true,
                atividade: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true },
                },
            },
        });
        const iniInIds = { in: iniciativasAtividades.map((r) => r.id) } as const;
        const atvInIds = { in: iniciativasAtividades.flatMap((r) => r.atividade).map((a) => a.id) } as const;

        // Iniciativa Responsavel + Responsável CP
        {
            const iniResponsavelRows = await prismaTx.iniciativaResponsavel.findMany({
                where: {
                    iniciativa_id: iniInIds,
                    pessoa_id: pessoaId,
                },
            });
            const irIds: number[] = [];
            for (const ir of iniResponsavelRows) {
                logger.verbose(
                    `Removendo iniciativaResponsavel de ${pessoaId} iniciativa_id ${ir.iniciativa_id}, coordenador_responsavel_cp=${ir.coordenador_responsavel_cp}`
                );
                irIds.push(ir.id);
            }
            await prismaTx.iniciativaResponsavel.deleteMany({ where: { pessoa_id: pessoaId, id: { in: irIds } } });
        }

        // Atividade Responsavel + Responsável CP
        {
            const iniResponsavelRows = await prismaTx.atividadeResponsavel.findMany({
                where: {
                    atividade_id: atvInIds,
                    pessoa_id: pessoaId,
                },
            });
            const arIds: number[] = [];
            for (const ar of iniResponsavelRows) {
                logger.verbose(
                    `Removendo atividadeResponsavel de ${pessoaId} atividade_id ${ar.atividade_id}, coordenador_responsavel_cp=${ar.coordenador_responsavel_cp}`
                );
                arIds.push(ar.id);
            }
            await prismaTx.atividadeResponsavel.deleteMany({ where: { pessoa_id: pessoaId, id: { in: arIds } } });
        }

        // Variavel do indicador da Meta/Iniciativa/Atividade
        {
            const variavelResponsavel = await prismaTx.variavelResponsavel.findMany({
                where: {
                    pessoa_id: pessoaId,
                    variavel: {
                        indicador_variavel: {
                            some: {
                                desativado_em: null,
                                indicador_origem: null,
                                indicador: {
                                    OR: [
                                        { meta_id: metasInIds },
                                        { iniciativa_id: iniInIds },
                                        { atividade_id: atvInIds },
                                    ],
                                },
                            },
                        },
                    },
                },
                include: {
                    variavel: {
                        select: {
                            indicador_variavel: {
                                where: {
                                    desativado_em: null,
                                    indicador_origem: null,
                                },
                                select: {
                                    indicador: {
                                        select: {
                                            meta_id: true,
                                            iniciativa_id: true,
                                            atividade_id: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const vrIds: number[] = [];
            for (const vr of variavelResponsavel) {
                logger.verbose(`Removendo variavelResponsavel de ${pessoaId} variavel ${JSON.stringify(vr.variavel)}`);
                vrIds.push(vr.id);
            }
            await prismaTx.variavelResponsavel.deleteMany({ where: { pessoa_id: pessoaId, id: { in: vrIds } } });
        }

        // Cronograma da meta/iniciativa/atividade
        {
            const etapaResponsavel = await prismaTx.etapaResponsavel.findMany({
                where: {
                    pessoa_id: pessoaId,
                    etapa: {
                        cronograma: {
                            removido_em: null,

                            OR: [{ meta_id: metasInIds }, { iniciativa_id: iniInIds }, { atividade_id: atvInIds }],
                        },
                    },
                },
                include: {
                    etapa: {
                        select: {
                            cronograma: {
                                select: {
                                    meta_id: true,
                                    iniciativa_id: true,
                                    atividade_id: true,
                                },
                            },
                        },
                    },
                },
            });
            const erIds: number[] = [];
            for (const er of etapaResponsavel) {
                logger.verbose(`Removendo etapaResponsavel de ${pessoaId} etapa ${JSON.stringify(er.etapa)}`);
                erIds.push(er.id);
            }
            await prismaTx.etapaResponsavel.deleteMany({ where: { pessoa_id: pessoaId, id: { in: erIds } } });
        }

        await logger.saveLogs(prismaTx, user.getLogData());
    }

    async transferirResponsabilidades(
        origemId: number,
        destinoId: number,
        metas: number[],
        prismaTx: Prisma.TransactionClient,
        user: PessoaFromJwt
    ): Promise<void> {
        await this.copiarResponsabilidades(origemId, destinoId, metas, prismaTx, user);
        await this.removerResponsabilidades(origemId, metas, prismaTx, user);
    }
}
