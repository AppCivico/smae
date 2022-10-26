import { Injectable } from '@nestjs/common';
import { PainelConteudoTipoDetalhe, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePainelConteudoDto, CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import { PainelConteudoIdAndMeta, PainelConteudoUpsertRet, UpdatePainelConteudoDto } from './dto/update-painel-conteudo.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';
import { PainelConteudo } from './entities/painel-conteudo-entity';

@Injectable()
export class PainelService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createPainelDto: CreatePainelDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const painel = await prisma.painel.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createPainelDto,
                },
                select: { id: true }
            });


            return painel;
        });

        return created;
    }

    async findAll(filters: FilterPainelDto | undefined = undefined) {
        let ativo = filters?.ativo;
        if (typeof ativo === undefined) {
            ativo = true;
        }

        return await this.prisma.painel.findMany({
            where: {
                ativo: ativo
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
                    select: {
                        id: true,
                        meta_id: true,
                        indicador_id: true,
                        mostrar_planejado: true,
                        mostrar_acumulado: true,
                        mostrar_indicador: true,
                        periodicidade: true,
                        periodo: true,
                        periodo_fim: true,
                        periodo_inicio: true,
                        periodo_valor: true,

                        detalhes: {
                            where: {
                                pai_id: null
                            },
                            orderBy: [
                                {ordem: 'asc'}
                            ],
                            select: {
                                tipo: true,
                                mostrar_indicador: true,
                                variavel: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                filhos: {
                                    select: {
                                        tipo: true,
                                        mostrar_indicador: true,

                                        variavel: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                            }
                                        },
                                        atividade: {
                                            select: {
                                                id: true,
                                                titulo: true
                                            }
                                        },
                                        filhos: {
                                            select: {
                                                tipo: true,
                                                mostrar_indicador: true,

                                                variavel: {
                                                    select: {
                                                        id: true,
                                                        titulo: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async getDetail(id: number) {
        return await this.prisma.painel.findFirstOrThrow({
            where: {id: id},
            select: {
                id: true,
                nome: true,
                ativo: true,
                periodicidade: true,
                mostrar_planejado_por_padrao: true,
                mostrar_acumulado_por_padrao: true,
                mostrar_indicador_por_padrao: true,

                painel_conteudo: {
                    select: {
                        id: true,
                        meta_id: true,
                        indicador_id: true,
                        mostrar_planejado: true,
                        mostrar_acumulado: true,
                        mostrar_indicador: true,
                        periodicidade: true,
                        periodo: true,
                        periodo_fim: true,
                        periodo_inicio: true,
                        periodo_valor: true,

                        meta: {
                            select: {
                                codigo: true,
                                titulo: true,
                            }
                        },

                        detalhes: {
                            where: {
                                pai_id: null
                            },
                            orderBy: [
                                {ordem: 'asc'}
                            ],
                            select: {
                                tipo: true,
                                mostrar_indicador: true,

                                variavel: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                filhos: {
                                    select: {
                                        tipo: true,
                                        mostrar_indicador: true,

                                        variavel: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                            }
                                        },
                                        atividade: {
                                            select: {
                                                id: true,
                                                titulo: true
                                            }
                                        },
                                        filhos: {
                                            select: {
                                                tipo: true,
                                                mostrar_indicador: true,

                                                variavel: {
                                                    select: {
                                                        id: true,
                                                        titulo: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }

    async update(id: number, UpdatePainelDto: UpdatePainelDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const painel = await prisma.painel.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...UpdatePainelDto,
                },
                select: { id: true }
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
            }
        });

        return removed;
    }

    
    async createConteudo(painel_id: number, createConteudoDto: CreateParamsPainelConteudoDto, user: PessoaFromJwt) {
        const ret = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<PainelConteudoUpsertRet>=> {
            const painel = await this.prisma.painel.findFirstOrThrow({
                where: {id: painel_id},
                select: {
                    mostrar_acumulado_por_padrao: true,
                    mostrar_indicador_por_padrao: true,
                    mostrar_planejado_por_padrao: true,

                    periodicidade: true,

                    painel_conteudo: {
                        select: {
                            id: true,
                            meta_id: true
                        }
                    }
                }
            });

            const conteudos = [];
            for (const meta of createConteudoDto.metas) {
                const conteudo_already_exists = painel.painel_conteudo.filter(r => {
                    return r.meta_id === meta
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
                            periodicidade: painel.periodicidade
                        },
                        select: {id: true, meta_id: true}
                    })
                )
            }
            const created = await Promise.all(conteudos);

            await this.populatePainelConteudoDetalhe(created, prisma);
            
            const deleted = await this.checkDeletedPainelConteudo(createConteudoDto.metas, painel.painel_conteudo, prisma);

            return {
                created: created,
                deleted: deleted
            };
        });
        
        return ret
    }

    async getPainelConteudoVisualizacao(id: number) {
        return await this.prisma.painelConteudo.findFirstOrThrow({
            where: {id: id},
            select: {
                id: true,
                periodicidade: true,
                periodo: true,
                periodo_valor: true,
                periodo_inicio: true,
                periodo_fim: true,
                mostrar_acumulado: true,
                mostrar_planejado: true,
                ordem: true,
            }
        })
    }

    async updatePainelConteudo(painel_id: number, painel_conteudo_id: number, updatePainelConteudoDto: UpdatePainelConteudoDto) {
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const painel_conteudo = await prisma.painelConteudo.findFirstOrThrow({where: {id: painel_conteudo_id}});
            if (painel_conteudo.painel_id !== painel_id) throw new Error('painel_conteudo inválido');

            const updated_painel_conteudo = await prisma.painelConteudo.update({
                where: {
                    id: painel_conteudo_id
                },
                data: {
                    ...updatePainelConteudoDto
                },
                select: {id: true}
            });

            return updated_painel_conteudo;
        });

        return { id: painel_conteudo_id }
    }

    async populatePainelConteudoDetalhe(conteudos: any[], prisma: Prisma.TransactionClient) {
        for (const painel_conteudo of conteudos) {

            const meta_indicador = await prisma.indicador.findMany({
                where: {
                    meta_id: painel_conteudo.meta_id
                },
                select: {id: true}
            })

            // Primeiro nivel
            for (const row of meta_indicador) {
                const parent = await prisma.painelConteudoDetalhe.create({
                    data: {
                        painel_conteudo_id: painel_conteudo.id,
                        mostrar_indicador: false,
                        tipo: PainelConteudoTipoDetalhe.Variavel
                    },
                    select: { id: true }
                });

                const indicador_variaveis = await prisma.indicadorVariavel.findMany({
                    where: {
                        indicador_id: row.id,
                        desativado: false
                    },
                    select: { variavel_id: true }
                });

                for (const row of indicador_variaveis) {
                    await prisma.painelConteudoDetalhe.create({
                        data: {
                            painel_conteudo_id: painel_conteudo.id,
                            variavel_id: row.variavel_id,
                            mostrar_indicador: false,
                            tipo: PainelConteudoTipoDetalhe.Variavel,
                            pai_id: parent.id
                        }
                    })
                }
            }

            const meta_iniciativas = await prisma.iniciativa.findMany({
                where: {
                    meta_id: painel_conteudo.meta_id,
                    ativo: true
                },
                select: { id: true }
            });

            // Segundo nível
            for (const iniciativa of meta_iniciativas) {
                const parent_iniciativa = await prisma.painelConteudoDetalhe.create({
                    data: {
                        painel_conteudo_id: painel_conteudo.id,
                        mostrar_indicador: false,
                        tipo: PainelConteudoTipoDetalhe.Iniciativa
                    },
                    select: { id: true }
                });

                const iniciativa_variaveis = await prisma.indicadorVariavel.findMany({
                    where: {
                        indicador: {
                            iniciativa_id: iniciativa.id
                        },
                        desativado: false
                    },
                    select: { variavel_id: true }
                })

                for (const variavel of iniciativa_variaveis) {
                    await prisma.painelConteudoDetalhe.create({
                        data: {
                            painel_conteudo_id: painel_conteudo.id,
                            variavel_id: variavel.variavel_id,
                            mostrar_indicador: false,
                            tipo: PainelConteudoTipoDetalhe.Iniciativa,
                            pai_id: parent_iniciativa.id
                        }
                    })
                }

                // Terceiro nível
                const atividades = await prisma.atividade.findMany({
                    where: {
                        iniciativa_id: iniciativa.id,
                        ativo: true
                    },
                    select: { id: true }
                });

                for (const atividade of atividades) {
                    const parent_atividade = await prisma.painelConteudoDetalhe.create({
                        data: {
                            painel_conteudo_id: painel_conteudo.id,
                            mostrar_indicador: false,
                            tipo: PainelConteudoTipoDetalhe.Atividade,
                            pai_id: parent_iniciativa.id
                        },
                        select: { id: true }
                    });

                    const atividade_variaveis = await prisma.indicadorVariavel.findMany({
                        where: {
                            indicador: {
                                atividade_id: atividade.id
                            },
                            desativado: false
                        },
                        select: { variavel_id: true }
                    });

                    for (const variavel of iniciativa_variaveis) {
                        await prisma.painelConteudoDetalhe.create({
                            data: {
                                painel_conteudo_id: painel_conteudo.id,
                                variavel_id: variavel.variavel_id,
                                mostrar_indicador: false,
                                tipo: PainelConteudoTipoDetalhe.Atividade,
                                pai_id: parent_atividade.id
                            }
                        })
                    }
                }
            }
        }
    }

    async checkDeletedPainelConteudo (metas: number[], conteudos: PainelConteudoIdAndMeta[], prisma: Prisma.TransactionClient): Promise<PainelConteudoIdAndMeta[]> {
        const deleted: PainelConteudoIdAndMeta[] = [];
        for (const existent_conteudo of conteudos) {

            const conteudo_kept = metas.filter(v => {
                return v === existent_conteudo.meta_id
            });

            if (conteudo_kept.length === 0) {
                
                const deleted_row = await prisma.painelConteudo.delete({
                    where: {
                        id: existent_conteudo.id
                    },
                    select: {
                        id: true,
                        meta_id: true
                    }
                });

                deleted.push(deleted_row)
            }
        }

        return deleted;
    }

}
