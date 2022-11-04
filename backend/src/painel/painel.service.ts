import { Injectable } from '@nestjs/common';
import { PainelConteudoTipoDetalhe, PainelGrupoPainel, Periodicidade, Periodo, Prisma } from '@prisma/client';
import { time } from 'console';
import moment from 'moment';
import { every } from 'rxjs';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import { SeriesTemplate } from './dto/detalhe-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import { PainelConteudoDetalheUpdateRet, PainelConteudoIdAndMeta, PainelConteudoUpsertRet, UpdatePainelConteudoDetalheDto, UpdatePainelConteudoVisualizacaoDto } from './dto/update-painel-conteudo.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';

@Injectable()
export class PainelService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createPainelDto: CreatePainelDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            
            let grupos_to_assign = [];
            if (createPainelDto.grupos) {
                const grupos = createPainelDto.grupos;
                delete createPainelDto.grupos;

                for (const grupo of grupos) {
                    grupos_to_assign.push({grupo_painel_id: grupo})
                }
            }

            const painel = await prisma.painel.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createPainelDto,

                    grupos: {
                        createMany: {
                            data: grupos_to_assign
                        }
                    }
                },
                select: { id: true }
            });


            return painel;
        });

        return created;
    }

    async findAll(filters: FilterPainelDto | undefined = undefined, user: PessoaFromJwt) {
        let ativo = filters?.ativo;
        if (typeof ativo === undefined) {
            ativo = true;
        }

        return await this.prisma.painel.findMany({
            where: {
                ativo: ativo,
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
                        mostrar_acumulado_periodo: true,
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
            where: {
                id: id
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
                            }
                        }
                    }
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
                                id: true,
                                tipo: true,
                                mostrar_indicador: true,

                                variavel: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true
                                    }
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true
                                    }
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
                                                codigo: true
                                            }
                                        },
                                        atividade: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                                codigo: true
                                            }
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
                                                        codigo: true
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

    async update(id: number, updatePainelDto: UpdatePainelDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let grupos_to_assign = [];
            if (updatePainelDto.grupos) {
                const grupos = updatePainelDto.grupos;
                delete updatePainelDto.grupos;

                for (const grupo of grupos) {
                    grupos_to_assign.push({grupo_painel_id: grupo})
                }

                await prisma.painelGrupoPainel.deleteMany({
                    where: {
                        painel_id: id,
                        grupo_painel_id: {
                            in: grupos
                        }
                    }
                })
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
                        }
                    }
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
                        select: {id: true, meta_id: true, mostrar_indicador: true}
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
                mostrar_acumulado_periodo: true,
                ordem: true,
            }
        })
    }

    async updatePainelConteudoVisualizacao(painel_id: number, painel_conteudo_id: number, updatePainelConteudoDto: UpdatePainelConteudoVisualizacaoDto) {
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

    async updatePainelConteudoDetalhes(painel_id: number, painel_conteudo_id: number, updatePainelConteudoDetalheDto: UpdatePainelConteudoDetalheDto) {
        const ret = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<PainelConteudoDetalheUpdateRet> => {
            const painel_conteudo = await prisma.painelConteudo.findFirstOrThrow({where: {id: painel_conteudo_id}});
            if (painel_conteudo.painel_id !== painel_id) throw new Error('painel_conteudo inválido');

            const operations = [];
            if (updatePainelConteudoDetalheDto.mostrar_indicador_meta || updatePainelConteudoDetalheDto.mostrar_indicador_meta === false) {
                operations.push(prisma.painelConteudo.update({
                    where: { id: painel_conteudo_id },
                    data: { mostrar_indicador: updatePainelConteudoDetalheDto.mostrar_indicador_meta },
                    select: {id: true}
                }));
            }

            for (const detalhe of updatePainelConteudoDetalheDto.detalhes!) {
                if (detalhe.mostrar_indicador!) {
                    operations.push(prisma.painelConteudoDetalhe.update({
                        where: {
                            id: detalhe.id,
                        },
                        data: { mostrar_indicador: detalhe.mostrar_indicador },
                        select: {id: true}
                    }))
                }
                else {
                    continue;
                }
            }

            const updated = await Promise.all(operations);

            return {updated};
        });

        return ret
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
                            tipo: PainelConteudoTipoDetalhe.Variavel
                        }
                    })
                }
            }

            const meta_iniciativas = await prisma.iniciativa.findMany({
                where: {
                    meta_id: painel_conteudo.meta_id,
                },
                select: { id: true }
            });

            // Segundo nível
            for (const iniciativa of meta_iniciativas) {
                const parent_iniciativa = await prisma.painelConteudoDetalhe.create({
                    data: {
                        painel_conteudo_id: painel_conteudo.id,
                        mostrar_indicador: false,
                        tipo: PainelConteudoTipoDetalhe.Iniciativa,
                        iniciativa_id: iniciativa.id
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
                            tipo: PainelConteudoTipoDetalhe.Variavel,
                            pai_id: parent_iniciativa.id,
                        }
                    })
                }

                // Terceiro nível
                const atividades = await prisma.atividade.findMany({
                    where: {
                        iniciativa_id: iniciativa.id,
                    },
                    select: { id: true }
                });

                for (const atividade of atividades) {
                    const parent_atividade = await prisma.painelConteudoDetalhe.create({
                        data: {
                            painel_conteudo_id: painel_conteudo.id,
                            mostrar_indicador: false,
                            tipo: PainelConteudoTipoDetalhe.Atividade,
                            pai_id: parent_iniciativa.id,
                            atividade_id: atividade.id
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

                    for (const variavel of atividade_variaveis) {
                        await prisma.painelConteudoDetalhe.create({
                            data: {
                                painel_conteudo_id: painel_conteudo.id,
                                variavel_id: variavel.variavel_id,
                                mostrar_indicador: false,
                                tipo: PainelConteudoTipoDetalhe.Variavel,
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

    async getPainelConteudoSerie (painel_conteudo_id: number) {
        let ret = {};
        const config = await this.getPainelConteudoVisualizacao(painel_conteudo_id);

        const current_year = new Date().getUTCFullYear();
        const current_month = new Date().getUTCMonth();

        let series_template: SeriesTemplate[] = []
        let gte;
        let lte;

        if (config.periodo === Periodo.Corrente) {
            if (config.periodicidade === Periodicidade.Anual) {
                gte = new Date( new Date().getFullYear(), 0, 1);
                lte = new Date( new Date().getFullYear(), 11, 31);


            } else if (config.periodicidade === Periodicidade.Semestral) {
                const year_start_epoch = new Date(new Date().getFullYear(), 0, 1).getTime();
                const half_year_epoch  = new Date(new Date().getFullYear(), 5, 1).getTime();
                const current_epoch    = Date.now();

                if (current_epoch >= half_year_epoch) {
                    gte = new Date(half_year_epoch);
                    lte = new Date( current_year, 11, 31);
                } else {
                    gte = new Date(year_start_epoch);
                    lte = new Date(half_year_epoch);
                }
            } else if (config.periodicidade === Periodicidade.Trimestral) {
                gte = moment().startOf('quarter').toDate();
                lte = moment().endOf('quarter').toDate();
            } else if (config.periodicidade === Periodicidade.Quadrimestral) {

                if (current_month <= 4) {
                    gte = new Date( current_year, 0, 1);
                    lte = new Date( current_year, 3, 30);
                } else if (current_month > 4 && current_month <= 8) {
                    gte = new Date( current_year, 4, 1);
                    lte = new Date( current_year, 7, 31);
                } else {
                    gte = new Date( current_year, 8, 1);
                    lte = new Date( current_year, 11, 31);
                }
            } else if (config.periodicidade === Periodicidade.Bimestral) {

                if (current_month % 2) {
                    gte = new Date( current_year, current_month - 1, 1);
                    lte = new Date( current_year, current_month, 31);
                } else {
                    gte = new Date( current_year, current_month - 2, 1);
                    lte = new Date( current_year, current_month - 1, 31);
                }
            } else if (config.periodicidade === Periodicidade.Mensal) {
                gte = new Date( current_year, current_month - 1, 1);
                lte = new Date( current_year, current_month - 1, 31);
            } else if (config.periodicidade === Periodicidade.Quinquenal) {
                gte = new Date( current_year - 5, 0, 1);
                lte = new Date( current_year, 11, 31);
            } else {
                gte = new Date( current_year - 100, 0, 1);
                lte = new Date( current_year, 11, 31);
            }

            series_template.push({
                titulo: gte.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}) +
                  ' - ' +
                  lte.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}),
                periodo_inicio: gte,
                periodo_fim: lte
            });
        }
        else if (config.periodo === Periodo.Anteriores) {
            if (!config.periodo_valor) throw new Error('Faltando periodo_valor na configuração do conteúdo do painel');

            if (config.periodicidade === Periodicidade.Anual) {
                gte = new Date( new Date().getFullYear() - config.periodo_valor, 0, 1);
                lte = new Date( new Date().getFullYear(), 0, 1);

                for (let i = 0; i < config.periodo_valor; i++) {
                    const periodo_inicio = new Date( new Date().getFullYear() - config.periodo_valor + i, 0, 1);
                    const periodo_fim    = new Date( new Date().getFullYear() - config.periodo_valor + i + 1, 0, 1 );

                    series_template.push({
                        titulo: periodo_inicio.getUTCFullYear().toString(),
                        periodo_inicio: periodo_inicio,
                        periodo_fim: periodo_fim
                    })
                }
            } else if (config.periodicidade === Periodicidade.Semestral) {
                const year_start_epoch = new Date(new Date().getFullYear(), 0, 1).getTime();
                const half_year_epoch  = new Date(new Date().getFullYear(), 5, 1).getTime();
                const current_epoch    = Date.now();

                if (current_epoch >= half_year_epoch) {
                    gte = new Date(half_year_epoch - 183 * 86400000 * config.periodo_valor);
                    lte = new Date(half_year_epoch);
                } else {
                    gte = new Date(year_start_epoch - 183 * 86400000 * config.periodo_valor);
                    lte = new Date(year_start_epoch);
                }

                for (let i = 0; i < config.periodo_valor; i++) {
                    const periodo_inicio = new Date(gte.getTime() + 183 * 86400000 * (config.periodo_valor + i));
                    const periodo_fim    = new Date(gte.getTime() + 183 * 86400000 * (config.periodo_valor + i + 1));

                    series_template.push({
                        titulo: periodo_inicio.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}),
                        periodo_inicio: periodo_inicio,
                        periodo_fim: periodo_fim
                    })
                }
            } else if (config.periodicidade === Periodicidade.Trimestral) {
                gte = moment().subtract(config.periodo_valor, 'quarter').startOf('quarter').toDate();
                lte = moment().startOf('quarter').toDate();

                for (let i = 0; i < config.periodo_valor; i++) {
                    const periodo_inicio = moment(gte).add(i, 'quarter').toDate();
                    const periodo_fim    = moment(gte).add(i + 1, 'quarter').toDate();

                    series_template.push({
                        titulo: periodo_inicio.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}),
                        periodo_inicio: periodo_inicio,
                        periodo_fim: periodo_fim
                    })
                }
            } else if (config.periodicidade === Periodicidade.Quadrimestral) {

                if (current_month <= 4) {
                    gte = moment(new Date( current_year, 0, 1)).subtract(config.periodo_valor * 4, 'months').toDate();
                    lte = new Date( current_year, 0, 1);
                } else if (current_month > 4 && current_month <= 8) {
                    gte = moment(new Date( current_year, 4, 1)).subtract(config.periodo_valor * 4, 'months').toDate();
                    lte = new Date( current_year, 4, 1);
                } else {
                    gte = moment(new Date( current_year, 8, 1)).subtract(config.periodo_valor * 4, 'months').toDate();
                    lte = new Date( current_year, 11, 31);
                }

                for (let i = 0; i < config.periodo_valor; i++) {
                    const periodo_inicio = moment(gte).add(i * 4, 'months').toDate();
                    const periodo_fim    = moment(gte).add(i * 4 + 4, 'months').toDate();

                    series_template.push({
                        titulo: periodo_inicio.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}),
                        periodo_inicio: periodo_inicio,
                        periodo_fim: periodo_fim
                    })
                }
            } else if (config.periodicidade === Periodicidade.Bimestral) {

                if (current_month % 2) {
                    gte = moment(new Date( current_year, current_month - 1, 1)).subtract(config.periodo_valor * 2, 'months').toDate();
                    lte = new Date( current_year, current_month, 31);
                } else {
                    gte = moment(new Date( current_year, current_month - 2, 1)).subtract(config.periodo_valor * 2, 'months').toDate();
                    lte = new Date( current_year, current_month - 1, 31);
                }

                for (let i = 0; i < config.periodo_valor; i++) {
                    const periodo_inicio = moment(gte).add(i * 2, 'months').toDate();
                    const periodo_fim    = moment(gte).add(i * 2 + 2, 'months').toDate();

                    series_template.push({
                        titulo: periodo_inicio.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}),
                        periodo_inicio: periodo_inicio,
                        periodo_fim: periodo_fim
                    })
                }
            } else if (config.periodicidade === Periodicidade.Mensal) {
                gte = moment(new Date( current_year, current_month - 1, 1)).subtract(config.periodo_valor, 'months').toDate();
                lte = new Date( current_year, current_month - 1, 31);

                for (let i = 0; i < config.periodo_valor; i++) {
                    const periodo_inicio = moment(gte).add(i * 1, 'months').toDate();
                    const periodo_fim    = moment(gte).add(i * 1 + 1, 'months').toDate();

                    series_template.push({
                        titulo: periodo_inicio.toLocaleString('pt-BR', {month: 'short', year: 'numeric'}),
                        periodo_inicio: periodo_inicio,
                        periodo_fim: periodo_fim
                    })
                }
            }
        }
        else {
            gte = new Date(0);
            lte = new Date();
        }

        const series = await this.prisma.painelConteudo.findFirstOrThrow({
            where: { id: painel_conteudo_id },
            select: {
                meta: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,

                        indicador: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,

                                SerieIndicador: {
                                    select: {
                                        serie: true,
                                        data_valor: true,
                                        valor_nominal: true
                                    }
                                }
                            }
                        }
                    }
                },

                detalhes: {
                    where: { mostrar_indicador: true },
                    orderBy: [ {ordem: 'asc'} ],
                    select: {
                        variavel: {
                            select: {
                                id: true,
                                titulo: true,
                                serie_variavel: {
                                    where: {
                                        data_valor: {
                                            gte: gte,
                                            lte: lte
                                        }
                                    },
                                    select: {
                                        serie: true,
                                        data_valor: true,
                                        valor_nominal: true
                                    }
                                }
                            },
                        },
                        iniciativa: {
                            select: {
                                id: true,
                                titulo: true,

                                Indicador: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,

                                        SerieIndicador: {
                                            where: {
                                                data_valor: {
                                                    gte: gte,
                                                    lte: lte
                                                }
                                            },
                                            select: {
                                                serie: true,
                                                data_valor: true,
                                                valor_nominal: true
                                            }
                                        }
                                    }
                                }
                            }
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
                                                    lte: lte
                                                }
                                            },
                                            select: {
                                                serie: true,
                                                data_valor: true,
                                                valor_nominal: true
                                            }
                                        }
                                    }
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,

                                        Indicador: {
                                            select: {
                                                id: true,
                                                codigo: true,
                                                titulo: true,
        
                                                SerieIndicador: {
                                                    where: {
                                                        data_valor: {
                                                            gte: gte,
                                                            lte: lte
                                                        }
                                                    },
                                                    select: {
                                                        serie: true,
                                                        data_valor: true,
                                                        valor_nominal: true
                                                    }
                                                }
                                            }
                                        }
                                    }
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
                                                            lte: lte
                                                        }
                                                    },
                                                    select: {
                                                        serie: true,
                                                        data_valor: true,
                                                        valor_nominal: true
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

        // ret = {
        //     meta: {
        //         id: series.meta.id,
        //         titulo: series.meta.codigo
        //     }
        // }

        return series;
    }

}

