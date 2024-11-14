import { BadRequestException, Injectable } from '@nestjs/common';
import { MetaStatusConsolidadoCf } from '@prisma/client';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { MfPessoaAcessoPdm } from '../../mf.service';
import {
    FilterMfDashEtapasDto,
    FilterMfDashMetasDto,
    ListMfDashMetasDto,
    MfDashEtapaHierarquiaDto,
    MfDashMetaAtrasadaDetalhesDto,
    MfDashMetaAtrasadaDto,
    MfDashMetaAtualizadasDto,
    MfDashMetaPendenteDto,
} from './dto/metas.dto';

export class Arr {
    static mergeUnique(a: number[], b: number[]): number[] {
        const uniqueSet = new Set([...a, ...b]);
        return Array.from(uniqueSet);
    }
    static intersection(a: number[], b: number[]): number[] {
        const setA = new Set(a);
        return b.filter((element) => setA.has(element));
    }
    static removeFrom(a: number[], b: number[]): number[] {
        const setB = new Set(b);
        return a.filter((element) => !setB.has(element));
    }
}

@Injectable()
export class MfDashMetasService {
    constructor(private readonly prisma: PrismaService) {}

    async metas(
        config: MfPessoaAcessoPdm,
        cicloFisicoId: number,
        params: FilterMfDashMetasDto
    ): Promise<ListMfDashMetasDto> {
        const ehPontoFocal = config.perfil === 'ponto_focal';

        const retornar_detalhes = !!params.retornar_detalhes;

        console.log(ehPontoFocal, config);
        if (params.visao_geral && ehPontoFocal)
            throw new BadRequestException('O seu perfil não pode utilizar a função de visão geral.');

        if (ehPontoFocal) {
            delete params.coordenadores_cp;
            delete params.metas;
            delete params.orgaos;
        }
        if (params.coordenadores_cp?.length == 0) delete params.coordenadores_cp;
        if (params.metas?.length == 0) delete params.metas;
        if (params.orgaos?.length == 0) delete params.orgaos;

        const ret: ListMfDashMetasDto = {
            atrasadas: null,
            pendentes: null,
            atualizadas: null,
            atrasadas_detalhes: null,
            perfil: config.perfil,
        };

        // padrão é puxar as metas do perfil da pessoa
        const metas = await this.aplicaFiltroMetas(params, config);

        const renderStatus = (
            r: { meta: IdCodTituloDto } & MetaStatusConsolidadoCf
        ): MfDashMetaPendenteDto | MfDashMetaAtualizadasDto => {
            const cronoTotal = Arr.intersection(r.cronograma_total, config.cronogramas_etapas);
            const cronoPendente = Arr.mergeUnique(
                Arr.intersection(r.cronograma_atraso_fim, config.cronogramas_etapas),
                Arr.intersection(r.cronograma_atraso_inicio, config.cronogramas_etapas)
            );
            // só retorna etapas separadas se for com detalhes
            const cronoAF = retornar_detalhes
                ? this.buildItem(r.cronograma_atraso_fim, config.cronogramas_etapas, config, params)
                : null;
            const cronoAI = retornar_detalhes
                ? this.buildItem(r.cronograma_atraso_inicio, config.cronogramas_etapas, config, params)
                : null;

            return {
                id: r.meta.id,
                codigo: r.meta.codigo,
                titulo: r.meta.titulo,
                analise_qualitativa_enviada: r.analise_qualitativa_enviada,
                fechamento_enviado: r.fechamento_enviado,
                risco_enviado: r.risco_enviado,
                variaveis: {
                    aguardando_complementacao: this.buildItem(
                        r.variaveis_aguardando_complementacao,
                        config.variaveis,
                        config,
                        params
                    ),
                    conferidas: this.buildItem(r.variaveis_conferidas, config.variaveis, config, params),
                    enviadas: this.buildItem(r.variaveis_enviadas, config.variaveis, config, params),
                    preenchidas: this.buildItem(r.variaveis_preenchidas, config.variaveis, config, params),
                    total: this.buildItem(r.variaveis_total, config.variaveis, config, params),
                    detalhes: null,
                },
                cronograma: {
                    preenchido: cronoTotal.length - cronoPendente.length,
                    total: cronoTotal.length,
                    atraso_fim: cronoAF,
                    atraso_inicio: cronoAI,
                    detalhes: null,
                },
                orcamento: {
                    preenchido: Arr.intersection(r.orcamento_pendentes, r.orcamento_preenchido).length,
                    total: r.orcamento_pendentes.length, // precisa ter um total de pendentes no ano corrente ou no 'mes/ciclo' que está aberto
                },
                atualizado_em: r.atualizado_em,
                fase: r.fase,
            };
        };

        let listaMetasPendentesPf: number[] = [];
        if ((params.retornar_pendentes || params.retornar_atualizadas) && ehPontoFocal)
            listaMetasPendentesPf = await this.metasPendentePontoFocal(config.pessoa_id, params);

        // se passar só retornar_detalhes, mas não ativar nenhum filtro de variavel ou cronograma, então
        // vai filtrar usando qualquer um deles (basicamente vira um OR, mas ta calculado já isso lá no banco)
        // se passar algum desses dois, vira undefined para o prisma ignorar o valor desse campo
        const usar_pendente_cp = retornar_detalhes
            ? !params.filtro_ponto_focal_variavel && !params.filtro_ponto_focal_cronograma
            : true;

        if (params.retornar_pendentes) {
            const pendentes = await this.prisma.metaStatusConsolidadoCf.findMany({
                where: {
                    ciclo_fisico_id: cicloFisicoId,
                    meta_id: { in: metas },

                    OR: ehPontoFocal
                        ? undefined
                        : [
                              { pendente_cp: usar_pendente_cp ? true : undefined },
                              {
                                  pendente_cp_cronograma:
                                      retornar_detalhes && params.filtro_ponto_focal_cronograma ? true : undefined,
                              },
                              {
                                  pendente_cp_variavel:
                                      retornar_detalhes && params.filtro_ponto_focal_variavel ? true : undefined,
                              },
                              // no detalhes, n importa o status do orçamento, mas na primeira tela, se tiver pendente
                              // precisa retornar
                              { orcamento_pendente: retornar_detalhes ? undefined : true },
                          ],

                    AND: ehPontoFocal ? [{ meta_id: { in: listaMetasPendentesPf } }] : undefined,
                },
                include: {
                    meta: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                },
                orderBy: [{ meta: { codigo: 'asc' } }],
            });
            ret.pendentes = pendentes.map(renderStatus);
            if (retornar_detalhes) await this.populaDetalhes(ret.pendentes);
        }

        if (params.retornar_atualizadas) {
            const atualizadas = await this.prisma.metaStatusConsolidadoCf.findMany({
                where: {
                    ciclo_fisico_id: cicloFisicoId,
                    meta_id: metas ? { in: metas } : undefined,

                    AND: ehPontoFocal
                        ? [{ meta_id: { notIn: listaMetasPendentesPf } }]
                        : [
                              { pendente_cp: usar_pendente_cp ? false : undefined },
                              {
                                  pendente_cp_cronograma:
                                      retornar_detalhes && params.filtro_ponto_focal_cronograma ? false : undefined,
                              },
                              {
                                  pendente_cp_variavel:
                                      retornar_detalhes && params.filtro_ponto_focal_variavel ? false : undefined,
                              },

                              // again, no detalhe, n importa o status do orçamento
                              { orcamento_pendente: retornar_detalhes ? undefined : false },
                          ],
                },
                include: {
                    meta: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                },
                orderBy: [{ meta: { codigo: 'asc' } }],
            });
            ret.atualizadas = atualizadas.map(renderStatus);
            if (retornar_detalhes) await this.populaDetalhes(ret.atualizadas);
        }

        if (params.retornar_atrasadas && !params.retornar_detalhes) {
            const atrasadas = await this.prisma.metaStatusAtrasoConsolidadoMes.findMany({
                where: {
                    meta_id: { in: metas },
                },
                include: {
                    meta: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                },
                orderBy: [
                    { meta: { codigo: 'asc' } },
                    {
                        mes: 'asc',
                    },
                ],
            });

            ret.atrasadas = [];

            const referencias: Record<number, MfDashMetaAtrasadaDto> = {};

            for (const r of atrasadas) {
                if (!referencias[r.meta_id]) {
                    referencias[r.meta_id] = {
                        atrasos_orcamento: [],
                        atrasos_variavel: [],
                        codigo: r.meta.codigo,
                        id: r.meta.id,
                        titulo: r.meta.titulo,
                    };
                    ret.atrasadas.push(referencias[r.meta_id]);
                }

                if (r.variaveis_atrasadas > 0) {
                    referencias[r.meta_id].atrasos_variavel.push({
                        data: r.mes,
                        total: r.variaveis_atrasadas,
                    });
                }
                if (r.orcamento_atrasados > 0) {
                    referencias[r.meta_id].atrasos_orcamento.push({
                        data: r.mes,
                        total: r.orcamento_atrasados,
                    });
                }
            }
        }

        if (params.retornar_atrasadas && params.retornar_detalhes) {
            const atrasadas = await this.prisma.metaStatusAtrasoVariavel.findMany({
                where: {
                    meta_id: { in: metas },
                },
                include: {
                    meta: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                    variavel: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                },
                orderBy: [
                    { meta: { codigo: 'asc' } },
                    {
                        variavel: {
                            codigo: 'asc',
                        },
                    },
                ],
            });

            ret.atrasadas_detalhes = [];

            const referencias: Record<number, MfDashMetaAtrasadaDetalhesDto> = {};

            for (const r of atrasadas) {
                if (!referencias[r.meta_id]) {
                    referencias[r.meta_id] = {
                        atrasos_variavel: [],
                        codigo: r.meta.codigo,
                        id: r.meta.id,
                        titulo: r.meta.titulo,
                    };
                    ret.atrasadas_detalhes.push(referencias[r.meta_id]);
                }

                referencias[r.meta_id].atrasos_variavel.push({
                    codigo: r.variavel.codigo,
                    id: r.variavel.id,
                    titulo: r.variavel.titulo,
                    meses: r.meses_atrasados.map((r) => r.toISOString().substring(0, 10)),
                });
            }
        }

        return ret;
    }

    private async populaDetalhes(list: MfDashMetaPendenteDto[] | MfDashMetaAtualizadasDto[]) {
        const variaveis: number[] = [];
        const etapas: number[] = [];
        for (const r of list) {
            if (Array.isArray(r.variaveis.total)) variaveis.push(...r.variaveis.total);
            if (Array.isArray(r.cronograma.atraso_fim)) etapas.push(...r.cronograma.atraso_fim);
            if (Array.isArray(r.cronograma.atraso_inicio)) etapas.push(...r.cronograma.atraso_inicio);
        }

        const variaveisDb = await this.prisma.variavel.findMany({
            where: { id: { in: variaveis } },
            select: { id: true, titulo: true, codigo: true },
        });
        const variaveisById = variaveisDb.reduce(
            (acc, item) => {
                acc[item.id.toString()] = item;
                return acc;
            },
            {} as Record<string, (typeof variaveisDb)[0]>
        );

        const etapasDb = await this.prisma.etapa.findMany({
            where: { id: { in: etapas } },
            select: { id: true, titulo: true },
        });

        const etapasById = etapasDb.reduce(
            (acc, item) => {
                acc[item.id.toString()] = item;
                return acc;
            },
            {} as Record<string, (typeof etapasDb)[0]>
        );

        for (const r of list) {
            if (Array.isArray(r.variaveis.total))
                r.variaveis.detalhes = r.variaveis.total.map((v) => variaveisById[v.toString()]);

            // inicializando a array vazia
            let arrUnion = [];

            if (Array.isArray(r.cronograma.atraso_inicio)) arrUnion.push(...r.cronograma.atraso_inicio);
            if (Array.isArray(r.cronograma.atraso_fim)) arrUnion = Arr.mergeUnique(arrUnion, r.cronograma.atraso_fim);

            r.cronograma.detalhes = arrUnion.map((v) => etapasById[v.toString()]);
        }
    }

    private buildItem(
        metaItem: number[],
        userItem: number[],
        config: MfPessoaAcessoPdm,
        params: FilterMfDashMetasDto
    ): number | number[] {
        const detalhes = !!params.retornar_detalhes;
        const visao_geral = !!params.visao_geral;

        // não precisa de nenhum filtro para admin_cp, pode voltar diretamente a lista da esquerda
        if (config.perfil == 'admin_cp' || (config.perfil == 'tecnico_cp' && visao_geral))
            return detalhes ? metaItem : metaItem.length;

        const list = Arr.intersection(metaItem, userItem);

        return detalhes ? list : list.length;
    }

    private async aplicaFiltroMetas(params: FilterMfDashMetasDto, config: MfPessoaAcessoPdm): Promise<number[]> {
        const metas: number[] = [];

        // se quer filtrar pelo cronograma, ou não é o ponto focal, adiciona tudo o que ele pode ver
        // isso é importante pro caso do not-in do atualizadas
        if (params.filtro_ponto_focal_cronograma || config.perfil != 'ponto_focal' || !params.retornar_detalhes) {
            metas.push(...config.metas_cronograma);
        }

        if (params.filtro_ponto_focal_variavel || config.perfil != 'ponto_focal' || !params.retornar_detalhes) {
            metas.push(...config.metas_variaveis);
        }

        const filterMetas = await this.prisma.meta.findMany({
            where: {
                removido_em: null,
                pdm: {
                    ativo: true,
                },
                AND: params.visao_geral
                    ? undefined
                    : [
                          { id: { in: metas } },
                          {
                              ViewMetaPessoaResponsavelNaCp:
                                  config.perfil == 'admin_cp' && !params.retornar_detalhes
                                      ? {
                                            some: {
                                                pessoa_id: config.pessoa_id,
                                            },
                                        }
                                      : undefined,
                          },
                      ],
                id: params.metas ? { in: params.metas } : undefined,

                ViewMetaPessoaResponsavelNaCp: params.coordenadores_cp
                    ? {
                          some: {
                              pessoa_id: { in: params.coordenadores_cp },
                          },
                      }
                    : undefined,

                meta_orgao: params.orgaos
                    ? {
                          some: {
                              orgao_id: { in: params.orgaos },
                          },
                      }
                    : undefined,
            },
            select: { id: true },
        });

        return filterMetas.map((r) => r.id);
    }

    private async metasPendentePontoFocal(pessoaId: number, params: FilterMfDashMetasDto): Promise<number[]> {
        const retornar_detalhes = !!params.retornar_detalhes;

        if (retornar_detalhes == false) {
            params.filtro_ponto_focal_cronograma = true;
            params.filtro_ponto_focal_variavel = true;
        }

        const pf_cronograma = !!params.filtro_ponto_focal_cronograma;
        const pf_variavel = !!params.filtro_ponto_focal_variavel;

        const metasPendentes: { meta_id: number }[] = await this.prisma.$queryRaw`
        SELECT
            msc.meta_id
        FROM
            pessoa_acesso_pdm pap
            JOIN meta_status_consolidado_cf msc ON (msc.meta_id = ANY(pap.metas_variaveis) OR msc.meta_id = ANY(pap.metas_cronograma))
            CROSS JOIN LATERAL (
                -- pra cada elemento da variaveis_total, cruza com o acesso
                SELECT
                    array_agg(element) AS variaveis_ponto_focal
                FROM
                    unnest(msc.variaveis_total) AS element
                WHERE
                    element = ANY (pap.variaveis)
            ) AS pf
        WHERE
            pap.pessoa_id = ${pessoaId}::int
        AND
        (
            -- não considera o orçamento na tela de detalhes (monitoramento)
            (
                CASE WHEN ${retornar_detalhes}::boolean THEN FALSE ELSE msc.orcamento_pendente END
            )
                OR
            (
                CASE WHEN ${pf_variavel}::boolean THEN
                    (
                    -- se tem alguma variavel aguardando aguarda_complementacao, match
                      ARRAY(SELECT DISTINCT UNNEST(msc.variaveis_aguardando_complementacao))
                        && -- operador overlap/sobreposição
                      ARRAY(SELECT DISTINCT UNNEST(pap.variaveis))
                    )
                        OR
                    (
                        CASE
                        -- se não tem nenhuma, não é pra dar como pendente
                        WHEN cardinality(pf.variaveis_ponto_focal) = 0 THEN
                            FALSE
                            -- se tem algum item, pra cada um deles, inverte o resultado do bool_and
                        WHEN cardinality(pf.variaveis_ponto_focal) > 0 THEN
                            NOT (
                                -- retorna TRUE se todos os verificados estão no set dos enviados
                                SELECT
                                    bool_and(element = ANY (msc.variaveis_preenchidas))
                                FROM
                                    unnest(pf.variaveis_ponto_focal) AS element)
                                -- se o banco usar químicos ruins e voltar um negativo, o default é false
                            ELSE
                                FALSE
                        END
                    )
                ELSE
                    FALSE
                END
            )
                OR
            (
                CASE WHEN ${pf_cronograma}::boolean THEN
                    (
                    -- se tem alguma cronograma atrasado no inicio
                      ARRAY(SELECT DISTINCT UNNEST(msc.cronograma_atraso_inicio))
                        && -- operador overlap/sobreposição
                      ARRAY(SELECT DISTINCT UNNEST(pap.cronogramas_etapas))
                    )
                        OR
                    (
                    -- se tem alguma cronograma atrasado no fim
                      ARRAY(SELECT DISTINCT UNNEST(msc.cronograma_atraso_fim))
                        && -- operador overlap/sobreposição
                      ARRAY(SELECT DISTINCT UNNEST(pap.cronogramas_etapas))
                    )
                ELSE
                    false
                END
            )
        )
    `;

        return metasPendentes.map((r) => r.meta_id);
    }

    async etapaHierarquia(filters: FilterMfDashEtapasDto): Promise<MfDashEtapaHierarquiaDto[]> {
        const metasPendentes = await this.prisma.view_etapa_rel_meta.findMany({
            where: {
                etapa_id: filters.etapas_ids ? { in: filters.etapas_ids } : undefined,
            },
        });

        return metasPendentes;
    }
}
