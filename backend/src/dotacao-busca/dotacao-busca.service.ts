import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, TipoProjeto } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    DotacaoBuscaDto,
    DotacaoBuscaResponseDto,
    PdmPsResumoDto,
    ProjetoObraResumoDto,
} from './dto/dotacao-busca.dto';
import { DotacaoService } from '../dotacao/dotacao.service';

const MAX_RESULTS_DEFAULT = 200;

@Injectable()
export class DotacaoBuscaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async searchByDotacao(dto: DotacaoBuscaDto): Promise<DotacaoBuscaResponseDto> {
        const { query, limit = MAX_RESULTS_DEFAULT, somenteAtivos = true } = dto;
        if (!query || !query.trim()) {
            throw new BadRequestException('Envie a dotação ou parte dela em "query".');
        }

        // normaliza a parte da dotação e monta padrão para ILIKE
        const parteNormalizada = this.dotacaoService.expandirParteDotacao(query.trim());

        const linhas = await this.prisma.orcamentoRealizado.findMany({
            where: {
                removido_em: null,
                dotacao: { startsWith: parteNormalizada },
            },
            select: {
                dotacao: true,
                dotacao_complemento: true,
                projeto: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        // Projeto pegaremos apenas os IDs, para buscar na view de projetos, pois lá os dados já vêm "prontos"
                        id: true,
                    },
                },
                meta: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,
                        pdm: {
                            select: {
                                id: true,
                                tipo: true,
                                rotulo_atividade: true,
                                rotulo_iniciativa: true,
                            },
                        },
                        meta_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        sigla: true,
                                    },
                                },
                            },
                        },
                        vinculosDistribuicaoRecursos: {
                            where: { removido_em: null, invalidado_em: null },
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                iniciativa: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,
                        iniciativa_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        sigla: true,
                                    },
                                },
                            },
                        },
                        meta: {
                            select: {
                                id: true,
                                titulo: true,
                                codigo: true,
                                pdm: {
                                    select: {
                                        id: true,
                                        tipo: true,
                                        rotulo_atividade: true,
                                        rotulo_iniciativa: true,
                                    },
                                },
                            },
                        },
                        distribuicaoRecursoVinculos: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                atividade: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,
                        atividade_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        sigla: true,
                                    },
                                },
                            },
                        },
                        iniciativa: {
                            select: {
                                id: true,
                                titulo: true,
                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,
                                        pdm: {
                                            select: {
                                                id: true,
                                                tipo: true,
                                                rotulo_atividade: true,
                                                rotulo_iniciativa: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        distribuicaoRecursoVinculos: {
                            where: { removido_em: null, invalidado_em: null },
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        const projetos: ProjetoObraResumoDto[] = [];
        const obras: ProjetoObraResumoDto[] = [];
        const pdm_ps: PdmPsResumoDto[] = [];

        // Buscando projetos na view.
        const projetosIds = linhas.map((x) => x.projeto?.id).filter((id): id is number => id !== undefined);
        const projetosLinhasView = await this.prisma.viewProjetoV2.findMany({
            where: {
                id: { in: projetosIds },
            },
            select: {
                id: true,
                nome: true,
                codigo: true,
                portfolio_id: true,
                portfolio_titulo: true,
                grupo_tematico_id: true,
                grupo_tematico_nome: true,
                tipo_intervencao_id: true,
                tipo_intervencao_nome: true,
                equipamento_id: true,
                equipamento_nome: true,
                empreendimento_id: true,
                empreendimento_nome: true,
                empreendimento_identificador: true,
                regioes: true,
                orgao_responsavel_id: true,
                orgao_responsavel_sigla: true,
                orgao_responsavel_descricao: true,
                projeto: {
                    select: {
                        tipo: true,
                        status: true,
                        // Count de vínculos
                        vinculosDistribuicaoRecursos: {
                            where: { removido_em: null },
                            select: { id: true },
                        },
                    },
                },
            },
        });

        for (const linhaProjetoView of projetosLinhasView) {
            if (linhaProjetoView.projeto.tipo === TipoProjeto.MDO) {
                obras.push({
                    id: linhaProjetoView.id,
                    nome: linhaProjetoView.nome,
                    codigo: linhaProjetoView.codigo,
                    portfolio_id: linhaProjetoView.portfolio_id,
                    portfolio_titulo: linhaProjetoView.portfolio_titulo,
                    orgao_responsavel_sigla: linhaProjetoView.orgao_responsavel_sigla,
                    status: linhaProjetoView.projeto.status,
                    subprefeitura_nomes: linhaProjetoView.regioes,
                    grupo_tematico_nome: linhaProjetoView.grupo_tematico_nome,
                    tipo_obra_nome: linhaProjetoView.tipo_intervencao_nome,
                    equipamento_nome: linhaProjetoView.equipamento_nome,
                    dotacoes_encontradas: [],
                    nro_vinculos: linhaProjetoView.projeto.vinculosDistribuicaoRecursos.length,
                });
            } else {
                projetos.push({
                    id: linhaProjetoView.id,
                    nome: linhaProjetoView.nome,
                    codigo: linhaProjetoView.codigo,
                    portfolio_id: linhaProjetoView.portfolio_id,
                    portfolio_titulo: linhaProjetoView.portfolio_titulo,
                    orgao_responsavel_sigla: linhaProjetoView.orgao_responsavel_sigla,
                    status: linhaProjetoView.projeto.status,
                    subprefeitura_nomes: linhaProjetoView.regioes,
                    grupo_tematico_nome: linhaProjetoView.grupo_tematico_nome,
                    tipo_obra_nome: linhaProjetoView.tipo_intervencao_nome,
                    equipamento_nome: linhaProjetoView.equipamento_nome,
                    dotacoes_encontradas: [],
                    nro_vinculos: linhaProjetoView.projeto.vinculosDistribuicaoRecursos.length,
                });
            }
        }

        for (const linha of linhas) {
            if (linha.meta) {
                pdm_ps.push({
                    pdm_id: linha.meta.pdm?.id ?? null,
                    meta_id: linha.meta.id,
                    meta_codigo: linha.meta.codigo,
                    meta_titulo: linha.meta.titulo,
                    orgaos_sigla: linha.meta.meta_orgao.map((x) => x.orgao.sigla),
                    rotulo_iniciativa: linha.meta.pdm?.rotulo_iniciativa ?? null,
                    rotulo_atividade: linha.meta.pdm?.rotulo_atividade ?? null,
                    iniciativa: null,
                    atividade: null,
                    dotacoes_encontradas: [],
                    nro_vinculos: linha.meta.vinculosDistribuicaoRecursos.length,
                });
            }
            if (linha.iniciativa) {
                pdm_ps.push({
                    pdm_id: linha.iniciativa.meta?.pdm?.id ?? null,
                    meta_id: linha.iniciativa.meta?.id ?? null,
                    meta_codigo: linha.iniciativa.meta?.codigo ?? null,
                    meta_titulo: linha.iniciativa.meta?.titulo ?? null,
                    orgaos_sigla: linha.iniciativa.iniciativa_orgao.map((x) => x.orgao.sigla),
                    rotulo_iniciativa: linha.iniciativa.meta?.pdm?.rotulo_iniciativa ?? null,
                    rotulo_atividade: linha.iniciativa.meta?.pdm?.rotulo_atividade ?? null,
                    iniciativa: {
                        id: linha.iniciativa.id,
                        codigo: linha.iniciativa.codigo,
                        titulo: linha.iniciativa.titulo,
                        nro_vinculos: linha.iniciativa.distribuicaoRecursoVinculos.length,
                    },
                    atividade: null,
                    dotacoes_encontradas: [],
                    nro_vinculos: linha.iniciativa.distribuicaoRecursoVinculos.length,
                });
            }
            if (linha.atividade) {
                pdm_ps.push({
                    pdm_id: linha.atividade.iniciativa?.meta?.pdm?.id ?? null,
                    meta_id: linha.atividade.iniciativa?.meta?.id ?? null,
                    meta_codigo: linha.atividade.iniciativa?.meta?.codigo ?? null,
                    meta_titulo: linha.atividade.iniciativa?.meta?.titulo ?? null,
                    orgaos_sigla: linha.atividade.atividade_orgao.map((x) => x.orgao.sigla),
                    rotulo_iniciativa: linha.atividade.iniciativa?.meta?.pdm?.rotulo_iniciativa ?? null,
                    rotulo_atividade: linha.atividade.iniciativa?.meta?.pdm?.rotulo_atividade ?? null,
                    iniciativa: null,
                    atividade: {
                        id: linha.atividade.id,
                        codigo: linha.atividade.codigo,
                        titulo: linha.atividade.titulo,
                        nro_vinculos: linha.atividade.distribuicaoRecursoVinculos.length,
                    },
                    dotacoes_encontradas: [],
                    nro_vinculos: linha.atividade.distribuicaoRecursoVinculos.length,
                });
            }
        }

        return { projetos, obras, pdm_ps };
    }
}
