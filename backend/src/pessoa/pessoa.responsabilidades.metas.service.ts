import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PessoaResponsabilidadesMetaService {
    private readonly logger = new Logger(PessoaResponsabilidadesMetaService.name);

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
        prismaTx: Prisma.TransactionClient
    ): Promise<void> {
        const metasInIds = { in: metas } as const;

        const destinoEhCoordenadorCp =
            (await prismaTx.view_pessoa_coordenador_responsavel_cp.count({
                where: { pessoa_id: destinoId },
            })) > 0;

        // Meta Responsavel + Responsável CP
        const metaResponsavelRows = await prismaTx.metaResponsavel.findMany({
            where: {
                meta_id: metasInIds,
                pessoa_id: origemId,
            },
        });
        const mrInput: Prisma.MetaResponsavelCreateManyInput[] = [];
        for (const mr of metaResponsavelRows) {
            if (mr.coordenador_responsavel_cp && !destinoEhCoordenadorCp) {
                this.logger.warn(
                    `Desativando cópia como metaResponsavel de ${origemId} para ${destinoId}, meta ${mr.meta_id}`
                );

                mr.coordenador_responsavel_cp = false;
            }

            this.logger.verbose(
                `Copiando metaResponsavel de ${origemId} para ${destinoId}, meta ${mr.meta_id}, coordenador_responsavel_cp=${mr.coordenador_responsavel_cp}`
            );
            mrInput.push({
                coordenador_responsavel_cp: mr.coordenador_responsavel_cp,
                orgao_id: mr.orgao_id,
                pessoa_id: destinoId,
                meta_id: mr.meta_id,
            });
        }
        await prismaTx.metaResponsavel.createMany({ data: mrInput });

        console.log(destinoEhCoordenadorCp);
    }

    async removerResponsabilidades(
        pessoaId: number,
        metas: number[],
        prismaTx: Prisma.TransactionClient
    ): Promise<void> {
        const metasInIds = { in: metas } as const;

        // Meta Responsavel + Responsável CP
        const metaResponsavelRows = await prismaTx.metaResponsavel.findMany({
            where: {
                meta_id: metasInIds,
                pessoa_id: pessoaId,
            },
        });
        const mrIds: number[] = [];
        for (const mr of metaResponsavelRows) {
            this.logger.verbose(
                `Removendo metaResponsavel de ${pessoaId} meta ${mr.meta_id}, coordenador_responsavel_cp=${mr.coordenador_responsavel_cp}`
            );
            mrIds.push(mr.id);
        }
        await prismaTx.metaResponsavel.deleteMany({ where: { id: { in: mrIds } } });
    }

    async transferirResponsabilidades(
        origemId: number,
        destinoId: number,
        metas: number[],
        prismaTx: Prisma.TransactionClient
    ): Promise<void> {
        await this.copiarResponsabilidades(origemId, destinoId, metas, prismaTx);
        await this.removerResponsabilidades(origemId, metas, prismaTx);
    }
}
