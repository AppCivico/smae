import { Injectable } from '@nestjs/common';
import { PessoaAcessoPdm } from '@prisma/client';
import { CicloFisicoAtivo } from 'src/pdm/dto/list-pdm.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CicloAtivoDto, IniciativasRetorno, MfMetaAgrupadaDto, RetornoMetaVariaveisDto } from './dto/mf-meta.dto';

type VariavelIdAtrasoNivel = {
    id: number;
    codigo: string;
    atraso_meses: number
    nivel: 'meta' | 'iniciativa' | 'atividade'
};

@Injectable()
export class MetasService {
    constructor(private readonly prisma: PrismaService) { }

    async metasPorFase(filters: { ids: number[] }): Promise<MfMetaAgrupadaDto[]> {

        const rows = await this.prisma.meta.findMany({
            where: {
                id: { in: filters.ids }
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                ciclo_fase: {
                    select: { ciclo_fase: true }
                }
            },
            orderBy: {
                codigo: 'asc'
            }
        });

        return rows.map((r) => {
            return {
                id: r.id,
                codigo: r.codigo,
                titulo: r.titulo,
                grupo: r.ciclo_fase?.ciclo_fase || 'Sem Ciclo Fase'
            }
        });
    }

    async metasPorStatus(filters: { ids: number[] }, ciclo_fisico_id: number): Promise<MfMetaAgrupadaDto[]> {

        const rows = await this.prisma.meta.findMany({
            where: {
                id: { in: filters.ids }
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,

                StatusMetaCicloFisico: {
                    where: {
                        ciclo_fisico_id: ciclo_fisico_id
                    },
                    select: {
                        status: true
                    }
                }
            },
            orderBy: {
                codigo: 'asc'
            }
        });

        return rows.map((r) => {
            return {
                id: r.id,
                codigo: r.codigo,
                titulo: r.titulo,
                grupo: r.StatusMetaCicloFisico[0]?.status || 'Não categorizado'
            }
        });
    }

    async metaVariaveis(
        meta_id: number,
        config: PessoaAcessoPdm,
        cicloFisicoAtivo: CicloAtivoDto,
    ): Promise<RetornoMetaVariaveisDto> {

        const map = await this.getVariaveisMeta(meta_id, config.variaveis);
        console.log(map);


        const indicador = await this.prisma.indicador.findFirst({
            where: {
                meta_id: meta_id,
                removido_em: null
            },
            select: { titulo: true, id: true, codigo: true }
        });

        const ret: RetornoMetaVariaveisDto = {
            perfil: config.perfil,
            variaveis: {
                indicador: indicador,
                status: {
                    aguarda_complementacao: 0,
                    aguarda_cp: 0,
                    nao_preenchidas: 0
                },
                iniciativas: []
            }
        }

        // busca apenas iniciativas que tem nas variaveis
        const iniciativas = await this.getIniciativas(meta_id, map);


        const atividades = await this.getAtividades(meta_id, map);
        console.log(atividades);


        for (const iniciativa of iniciativas) {
            const retInit: IniciativasRetorno = {
                atividades: [],
                indicador: { ...iniciativa.Indicador[0] },
                iniciativa: { id: iniciativa.id, codigo: iniciativa.codigo, titulo: iniciativa.titulo },
                status: {
                    aguarda_complementacao: 0,
                    aguarda_cp: 0,
                    nao_preenchidas: 0,
                }
            };

            for (const atividade of atividades) {
                if (atividade.iniciativa_id != iniciativa.id) continue;

                retInit.atividades.push({
                    indicador: { ...atividade.Indicador[0] },
                    atividade: { id: atividade.id, codigo: atividade.codigo, titulo: atividade.titulo },
                    status: {
                        aguarda_complementacao: 0,
                        aguarda_cp: 0,
                        nao_preenchidas: 0,
                    }
                });

            }

            ret.variaveis.iniciativas.push(retInit)
        }
        console.log(iniciativas);

        return ret;

    }


    private async getAtividades(meta_id: number, map: Record<number, VariavelIdAtrasoNivel>) {
        return await this.prisma.atividade.findMany({
            where: {
                removido_em: null,
                Indicador: {
                    some: {
                        removido_em: null,
                        IndicadorVariavel: {
                            some: {
                                desativado_em: null,
                                variavel_id: { in: Object.keys(map).map(n => +n) }
                            }
                        }
                    }
                }
            },
            select: {
                titulo: true, id: true, codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true, titulo: true, codigo: true },
                },
                iniciativa_id: true
            }
        });
    }

    private async getIniciativas(meta_id: number, map: Record<number, VariavelIdAtrasoNivel>) {
        return await this.prisma.iniciativa.findMany({
            where: {
                meta_id: meta_id,
                removido_em: null,
                Indicador: {
                    some: {
                        removido_em: null,
                        IndicadorVariavel: {
                            some: {
                                desativado_em: null,
                                variavel_id: { in: Object.keys(map).map(n => +n) }
                            }
                        }
                    }
                }
            },
            select: {
                titulo: true, id: true, codigo: true,
                Indicador: {
                    where: {
                        removido_em: null,
                    },
                    select: { id: true, titulo: true, codigo: true }
                }
            }
        });
    }

    private async getVariaveisMeta(meta_id: number, inIds: number[]) {
        const map: Record<number, VariavelIdAtrasoNivel> = {};
        const variaveis_da_meta = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        desativado_em: null,
                        indicador_origem: null,
                        indicador: {
                            meta_id: meta_id,
                            removido_em: null
                        }
                    }
                },
            },
            select: {
                id: true,
                codigo: true,
                atraso_meses: true
            }
        });
        for (const r of variaveis_da_meta) {
            map[r.id] = { ...r, nivel: 'meta' };
        }

        const variaveis_da_iniciativa = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        indicador_origem: null,
                        desativado_em: null,
                        indicador: {
                            removido_em: null,
                            iniciativa: {
                                meta_id: meta_id,
                                removido_em: null
                            }
                        }
                    }
                },
            },
            select: {
                id: true,
                codigo: true,
                atraso_meses: true
            }
        });
        for (const r of variaveis_da_iniciativa) {
            map[r.id] = { ...r, nivel: 'iniciativa' };
        }

        const variaveis_da_atividade = await this.prisma.variavel.findMany({
            where: {
                id: { in: inIds },
                indicador_variavel: {
                    some: {
                        indicador_origem: null,
                        desativado_em: null,
                        indicador: {
                            atividade: {
                                removido_em: null,
                                iniciativa: {
                                    meta_id: meta_id,
                                    removido_em: null
                                }
                            }
                        }
                    }
                },
            },
            select: {
                id: true,
                codigo: true,
                atraso_meses: true
            }
        });
        for (const r of variaveis_da_atividade) {
            map[r.id] = { ...r, nivel: 'atividade' };
        }

        return map;
    }


}
