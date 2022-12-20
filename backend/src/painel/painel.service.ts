import { Injectable } from '@nestjs/common';
import { PainelConteudoTipoDetalhe, PainelGrupoPainel, Periodicidade, Periodo, Prisma } from '@prisma/client';
import { Decimal, transformDocument } from '@prisma/client/runtime';
import { time } from 'console';
import { DateTime } from 'luxon';
import * as moment from 'moment';
import { every } from 'rxjs';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import { PainelConteudoSerie, SerieRow, SeriesTemplate } from './dto/detalhe-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import { PainelConteudoDetalheUpdateRet, PainelConteudoIdAndMeta, PainelConteudoUpsertRet, UpdatePainelConteudoDetalheDto, UpdatePainelConteudoVisualizacaoDto } from './dto/update-painel-conteudo.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';

export class PainelDateRange {
    start: Date
    end: Date
}

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

            const pdm_ativo = await prisma.pdm.findFirstOrThrow({
                where: { ativo: true },
                select: { id: true }
            });

            const painel = await prisma.painel.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    pdm_id: pdm_ativo.id,
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
                                id: true,
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
                                        id: true,
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

    async syncDetalhes(painel_id: number) {
        const painel = await this.prisma.painel.findFirstOrThrow({
            where: {id: painel_id},
            select: {
                painel_conteudo: {
                    select: {
                        meta: {
                            select: {
                                id: true,

                            }
                        }
                    }
                }
            }
        })
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
                const painel_conteudo = await prisma.painelConteudo.findFirst({
                    where: { id: painel_conteudo_id },
                    select: { mostrar_indicador: true }
                });

                if (painel_conteudo?.mostrar_indicador != updatePainelConteudoDetalheDto.mostrar_indicador_meta) {
                    operations.push(prisma.painelConteudo.update({
                        where: { id: painel_conteudo_id },
                        data: { mostrar_indicador: updatePainelConteudoDetalheDto.mostrar_indicador_meta },
                        select: {id: true}
                    }));
                }
            }

            for (const detalhe of updatePainelConteudoDetalheDto.detalhes!) {
                operations.push(prisma.painelConteudoDetalhe.update({
                    where: {
                        id: detalhe.id
                    },
                    data: { mostrar_indicador: detalhe.mostrar_indicador },
                    select: {id: true}
                }))
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

    async secondsDiff(d1: number, d2: number) {
        let millisecondDiff = d2 - d1;
        let secDiff = Math.floor( ( d2 - d1) / 1000 );
        return secDiff;
    }

    async minutesDiff(d1: number, d2: number) {
        let seconds = await this.secondsDiff(d1, d2);
        let minutesDiff = Math.floor( seconds / 60 );
        return minutesDiff;
    }

    async hoursDiff(d1: number, d2: number) {
        let minutes = await this.minutesDiff(d1, d2);
        let hoursDiff = Math.floor( minutes / 60 );
        return hoursDiff;
    }

    async daysDiff(d1: number, d2: number) {
        let hours = await this.hoursDiff(d1, d2);
        let daysDiff = Math.floor( hours / 24 );
        return daysDiff;
    }

    async weeksDiff(d1: number, d2: number) {
        let days = await this.daysDiff(d1, d2);
        let weeksDiff = Math.floor( days/ 7 );
        return weeksDiff;
    }

    async yearsDiff(d1: number, d2: number) {
        let date1 = new Date(d1);
        let date2 = new Date(d2);
        let yearsDiff =  date2.getFullYear() - date1.getFullYear();
        return yearsDiff;
    }

    async monthsDiff(d1: number, d2: number) {
        let date1 = new Date(d1);
        let date2 = new Date(d2);
        let years = await this.yearsDiff(d1, d2);
        let months =(years * 12) + (date2.getMonth() - date1.getMonth()) ;
        return months;
    }

    async buildSeriesOrder(mostrar_planejado: boolean, mostrar_acumulado: boolean): Promise<string[]> {
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

    async getMultiplierForPeriodicidade (periodicidade: Periodicidade): Promise<number> {
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
                multiplier = 4
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

    async getStartEndDate (periodo: Periodo, periodicidade: Periodicidade, periodo_valor: number | null, periodo_inicio: Date | null, periodo_fim: Date | null): Promise<PainelDateRange> {
        let ret: {
            start: Date,
            end: Date
        } = {
            start: new Date(0),
            end: new Date()
        };
    
        if (periodo === Periodo.Anteriores) {
            if (!periodo_valor) throw new Error('Faltando periodo_valor na configuração do conteúdo do painel');

            const multiplier = await this.getMultiplierForPeriodicidade(periodicidade);

            if ( periodicidade === Periodicidade.Anual ||
                 periodicidade === Periodicidade.Quinquenal ||
                 periodicidade === Periodicidade.Secular) {

                ret.start = new Date( new Date().getFullYear() - periodo_valor * multiplier, 0, 1);
                ret.end   = new Date( new Date().getFullYear(), 0, 1 );
            } else if (periodicidade === Periodicidade.Semestral) {
                const year_start_epoch = new Date(new Date().getFullYear(), 0, 1).getTime();
                const half_year_epoch  = new Date(new Date().getFullYear(), 5, 1).getTime();
                const current_epoch    = Date.now();

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
                    ret.start = moment(new Date( current_year, 0, 1)).subtract(periodo_valor * 4, 'months').toDate();
                    ret.end = new Date( current_year, 0, 1);
                } else if (current_month > 4 && current_month <= 8) {
                    ret.start = moment(new Date( current_year, 4, 1)).subtract(periodo_valor * 4, 'months').toDate();
                    ret.end = new Date( current_year, 4, 1);
                } else {
                    ret.start = moment(new Date( current_year, 8, 1)).subtract(periodo_valor * 4, 'months').toDate();
                    ret.end = new Date( current_year, 11, 31);
                }
            } else if (periodicidade === Periodicidade.Trimestral) {
                ret.start = DateTime.now().minus({quarter: periodo_valor}).startOf('quarter').toJSDate();
                ret.end   = DateTime.now().startOf('quarter').toJSDate();
            } else if (periodicidade === Periodicidade.Bimestral) {
                const current_month = new Date().getUTCMonth();
                const current_year = new Date().getUTCFullYear();

                if (current_month % 2) {
                    ret.start = moment(new Date( current_year, current_month - 1, 1)).subtract(periodo_valor * 2, 'months').toDate();
                    ret.end = new Date( current_year, current_month, 31);
                } else {
                    ret.start = moment(new Date( current_year, current_month - 2, 1)).subtract(periodo_valor * 2, 'months').toDate();
                    ret.end = new Date( current_year, current_month - 1, 31);
                }
            } else if (periodicidade === Periodicidade.Mensal) {

                ret.start = DateTime.now().startOf('month').minus({months: periodo_valor}).toJSDate();
                ret.end = DateTime.now().startOf('month').minus({day: 1}).toJSDate();
            } else {
                throw new Error('faltando tratamento para periodicidade: ' + periodicidade)
            }
        } else if (periodo === Periodo.EntreDatas) {
            if (!periodo_inicio || !periodo_fim)
              throw new Error('Faltando configuração de periodos');

            ret.start = periodo_inicio;
            ret.end   = periodo_fim;
        } else {
            ret.start = new Date(0);
            ret.end   = new Date();
        }

        return ret;
    }

    async getTitle (periodicidade: Periodicidade, start: DateTime, end: DateTime): Promise<string> {
        let ret: string;

        if (periodicidade === Periodicidade.Semestral ||
            periodicidade === Periodicidade.Trimestral ||
            periodicidade === Periodicidade.Quadrimestral ||
            periodicidade === Periodicidade.Bimestral) {
                ret = end.toLocaleString({month: 'short', year: 'numeric'});
        } else if (
            periodicidade === Periodicidade.Secular ||
            periodicidade === Periodicidade.Quinquenal ||
            periodicidade === Periodicidade.Anual) {
                ret = start.toLocaleString({year: 'numeric'});
        } else {
            ret = start.toLocaleString({month: 'short', year: 'numeric'});
        }

        return ret;
    }

    async getSeriesTemplate (periodicidade: Periodicidade, periodo_valor: number | null, start_date: Date, end_date: Date, series_order_size: number): Promise<SeriesTemplate[]> {
        const series_template: SeriesTemplate[] = [];

        let config: {
            time_unit: string  | null,
            multiplier: number | null,

        } = {
            time_unit: null,
            multiplier: null
        };

        switch (periodicidade) {
            case Periodicidade.Secular:
                config.time_unit  = 'years';
                config.multiplier = 100;
                break;
            case Periodicidade.Quinquenal:
                config.time_unit  = 'years';
                config.multiplier = 5;
                break;
            case Periodicidade.Anual:
                config.time_unit  = 'years';
                config.multiplier = 1;
                break;
            case Periodicidade.Semestral:
                config.time_unit  = 'quarter';
                config.multiplier = 2;
                break;
            case Periodicidade.Quadrimestral:
                config.time_unit  = 'months';
                config.multiplier = 4;
                break;
            case Periodicidade.Trimestral:
                config.time_unit  = 'months';
                config.multiplier = 3;
                break;
            case Periodicidade.Bimestral:
                config.time_unit  = 'months';
                config.multiplier = 2;
                break;
            case Periodicidade.Mensal:
                config.time_unit  = 'months';
                config.multiplier = 1;
        }

        if (!config.multiplier || !config.time_unit)
          throw new Error('Faltando tratamento para configuração do painel, na geração de janelas de tempo');

        if (!periodo_valor) periodo_valor = 1;

        const empty_values: (number | "" | Decimal)[] = [];
        while (empty_values.length < series_order_size) {
            empty_values.push('');
        }

        const start  = DateTime.fromJSDate(start_date).setLocale('pt-BR');
        const end    = DateTime.fromJSDate(end_date).setLocale('pt-BR');

        let window_start: DateTime = start;
        let window_end:   DateTime | null = null;

        let i = 0;
        while (window_start < end) {
            if (periodicidade === Periodicidade.Semestral) {
                window_start = window_end ? window_start.plus({quarter: 1}).startOf('quarter') : window_start.startOf('quarter');
                window_end = window_start.plus({quarters: 1}).endOf('quarter');
            } else {
                let plus_obj: any = {};
                plus_obj[config.time_unit] = (i == 0) ? config.multiplier - 1 : config.multiplier;
                window_end = window_start.plus(plus_obj);
            }

            series_template.push({
                titulo: await this.getTitle(periodicidade, window_start, window_end),
                periodo_inicio: window_start.toJSDate(),
                periodo_fim: window_end.toJSDate(),
                valores_nominais: empty_values
            });

            window_start = window_end;
            i++;
        }

        return series_template;
    }

    async getPainelConteudoSerie (painel_conteudo_id: number): Promise<PainelConteudoSerie> {
        let ret = <PainelConteudoSerie>{};
        const config = await this.getPainelConteudoVisualizacao(painel_conteudo_id);

        let series_template: SeriesTemplate[] = []
        let gte;
        let lte;

        const series_order = await this.buildSeriesOrder(config.mostrar_planejado, config.mostrar_acumulado);

        if (config.periodo === Periodo.Anteriores) {
            if (!config.periodo_valor) throw new Error('Faltando periodo_valor na configuração do conteúdo do painel');

            const date_range = await this.getStartEndDate(config.periodo, config.periodicidade, config.periodo_valor, config.periodo_fim, config.periodo_fim);
            gte = date_range.start;
            lte = date_range.end;

            series_template = await this.getSeriesTemplate(config.periodicidade, config.periodo_valor, gte, lte, series_order.length);
        }
        else if (config.periodo === Periodo.EntreDatas) {
            if (!config.periodo_inicio || !config.periodo_fim)
              throw new Error('Faltando configuração de periodos');

            gte = config.periodo_inicio;
            lte = config.periodo_fim;

            series_template = await this.getSeriesTemplate(config.periodicidade, config.periodo_valor, gte, lte, series_order.length);
        }
        else {
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
                                            lte: lte
                                        },
                                        ha_conferencia_pendente: false
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

                detalhes: {
                    where: {
                        mostrar_indicador: true,
                        pai_id: null
                    },
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
                                        },
                                        conferida: true
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
                                    where: {removido_em: null},
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,

                                        SerieIndicador: {
                                            where: {
                                                data_valor: {
                                                    gte: gte,
                                                    lte: lte
                                                },
                                                ha_conferencia_pendente: false
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
                                                },
                                                conferida: true
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
                                            where: {removido_em: null},
                                            select: {
                                                id: true,
                                                codigo: true,
                                                titulo: true,
        
                                                SerieIndicador: {
                                                    where: {
                                                        data_valor: {
                                                            gte: gte,
                                                            lte: lte
                                                        },
                                                        ha_conferencia_pendente: false
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
                                                        },
                                                        conferida: true
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

        if (config.periodo === Periodo.Todos) {
            const all_series: SerieRow[] = [];

            series.meta.indicador.forEach(r => {
                r.SerieIndicador.forEach(s => { all_series.push(s) });
            })

            series.detalhes.forEach(d => {
                d.variavel?.serie_variavel.forEach(s => { all_series.push(s) });
                
                d.iniciativa?.Indicador.forEach(i => {
                    i.SerieIndicador.forEach(s => { all_series.push(s) })
                });
                
                d.filhos.forEach(f => {
                    f.atividade?.Indicador.forEach(i => {
                        i.SerieIndicador.forEach(s => { all_series.push(s) });
                    });

                    f.variavel?.serie_variavel.forEach(s => { all_series.push(s) });
                    
                    f.filhos.forEach(ff => {
                        ff.variavel?.serie_variavel.forEach(s => { all_series.push(s) })
                    })
                });
            });

            if (all_series.length > 0) {
                all_series.sort( function compare (a, b) {
                    const date_a = new Date(a.data_valor).getTime();
                    const date_b = new Date(b.data_valor).getTime();
                    return date_a - date_b;
                });
    
                const earliest = new Date(all_series[0].data_valor);
                const latest   = new Date(all_series.at(-1)!.data_valor);
    
                series_template = await this.getSeriesTemplate(config.periodicidade, null, earliest, latest, series_order.length);
                console.debug(series_template);
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

                indicador: series.mostrar_indicador ? {
                    id: series.meta.indicador[0].id,
                    codigo: series.meta.indicador[0].codigo,
                    titulo: series.meta.indicador[0].titulo,

                    series: series_template.map(t => {
                        const series_for_period = series.meta.indicador[0].SerieIndicador.filter(r => {
                            return r.data_valor.getTime() >= t.periodo_inicio.getTime() && r.data_valor.getTime() <= t.periodo_fim.getTime()
                        });

                        return {
                            titulo: t.titulo,
                            periodo_inicio: t.periodo_inicio,
                            periodo_fim: t.periodo_fim,


                            valores_nominais: t.valores_nominais.map((vn, ix) => {
                                const serie_match_arr = series_for_period.filter(sm => { return sm.serie == series_order[ix] });
                                const serie_match     = serie_match_arr[0];

                                if (serie_match) {
                                    return serie_match.valor_nominal
                                } else { return "" }
                            })
                        }
                    })
                } : {}
            },
            
            detalhes: series.detalhes.map(d => {
                return {
                    variavel: {
                        id: d.variavel?.id,
                        titulo: d.variavel?.titulo,

                        series: series_template.map(t => {
                            const series_for_period = d.variavel?.serie_variavel.filter(r => {
                                r.data_valor.getTime() >= t.periodo_inicio.getTime() && r.data_valor.getTime() <= t.periodo_fim.getTime()
                            }) || [];

                            return {
                                titulo: t.titulo,
                                periodo_inicio: t.periodo_inicio,
                                periodo_fim: t.periodo_fim,
                                valores_nominais: t.valores_nominais.map((vn, ix) => {
                                    const serie_match_arr = series_for_period.filter(sm => { return sm.serie == series_order[ix] });
                                    const serie_match     = serie_match_arr[0];
    
                                    if (serie_match) {
                                        return serie_match.valor_nominal
                                    } else { return "" }
                                })
                            }
                        })
                    },

                    iniciativa: {
                        id: d.iniciativa?.id,
                        titulo: d.iniciativa?.titulo,

                        indicador: d.iniciativa?.Indicador.map(i => {

                            return {
                                id: i.id,
                                codigo: i.codigo,
                                titulo: i.titulo,

                                series: series_template.map(t => {
                                    const series_for_period = i.SerieIndicador.filter(r => {
                                        return r.data_valor.getTime() >= t.periodo_inicio.getTime() && r.data_valor.getTime() <= t.periodo_fim.getTime()
                                    }) || [];

                                    return {
                                        titulo: t.titulo,
                                        periodo_inicio: t.periodo_inicio,
                                        periodo_fim: t.periodo_fim,
                                        valores_nominais: t.valores_nominais.map((vn, ix) => {
                                            const serie_match_arr = series_for_period.filter(sm => { return sm.serie == series_order[ix] });
                                            const serie_match     = serie_match_arr[0];
            
                                            if (serie_match) {
                                                return serie_match.valor_nominal
                                            } else { return "" }
                                        })
                                    }
                                })
                            }
                        })
                    },

                    filhos: d.filhos.map(f => {

                        return {
                            variavel: {
                                id: f.variavel?.id,
                                titulo: f.variavel?.titulo,
                                series: series_template.map(t => {
                                    const series_for_period = f.variavel?.serie_variavel.filter(r => {
                                        return r.data_valor.getTime() >= t.periodo_inicio.getTime() && r.data_valor.getTime() <= t.periodo_fim.getTime()
                                    }) || [];
        
                                    return {
                                        titulo: t.titulo,
                                        periodo_inicio: t.periodo_inicio,
                                        periodo_fim: t.periodo_fim,
                                        valores_nominais: t.valores_nominais.map((vn, ix) => {
                                            const serie_match_arr = series_for_period.filter(sm => { return sm.serie == series_order[ix] });
                                            const serie_match     = serie_match_arr[0];
            
                                            if (serie_match) {
                                                return serie_match.valor_nominal
                                            } else { return "" }
                                        })
                                    }
                                })
                            },

                            atividade: {
                                id: f.atividade?.id,
                                titulo: f.atividade?.titulo,

                                indicador: f.atividade?.Indicador.map(i => {
                                    return {
                                        id: i.id,
                                        codigo: i.codigo,
                                        titulo: i.titulo,
        
                                        series: series_template.map(t => {
                                            const series_for_period = i.SerieIndicador.filter(r => {
                                                return r.data_valor.getTime() >= t.periodo_inicio.getTime() && r.data_valor.getTime() <= t.periodo_fim.getTime()
                                            }) || []; 
        
                                            return {
                                                titulo: t.titulo,
                                                periodo_inicio: t.periodo_inicio,
                                                periodo_fim: t.periodo_fim,
                                                valores_nominais: t.valores_nominais.map((vn, ix) => {
                                                    const serie_match_arr = series_for_period.filter(sm => { return sm.serie == series_order[ix] });
                                                    const serie_match     = serie_match_arr[0];
                    
                                                    if (serie_match) {
                                                        return serie_match.valor_nominal
                                                    } else { return "" }
                                                })
                                            }
                                        })
                                    }
                                })
                            },

                            filhos: f.filhos.map(af => {
                                return {variavel: {
                                    id: af.variavel?.id,
                                    titulo: af.variavel?.titulo,

                                    series: series_template.map(t => {
                                        const series_for_period = af.variavel?.serie_variavel.filter(r => {
                                            return r.data_valor.getTime() >= t.periodo_inicio.getTime() && r.data_valor.getTime() <= t.periodo_fim.getTime()
                                        }) || [];
            
                                        return {
                                            titulo: t.titulo,
                                            periodo_inicio: t.periodo_inicio,
                                            periodo_fim: t.periodo_fim,
                                            valores_nominais: t.valores_nominais.map((vn, ix) => {
                                                const serie_match_arr = series_for_period.filter(sm => { return sm.serie == series_order[ix] });
                                                const serie_match     = serie_match_arr[0];
                
                                                if (serie_match) {
                                                    return serie_match.valor_nominal
                                                } else { return "" }
                                            })
                                        }
                                    })
                                }}
                            })
                        }
                    })
                }
            }),

            ordem_series: series_order
        }

        return ret;
    }

}

