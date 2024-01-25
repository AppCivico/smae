import { BadRequestException, Injectable } from '@nestjs/common';
import { MetaStatusConsolidadoCf } from '@prisma/client';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    FilterMfDashMetasDto,
    ListMfDashMetasDto,
    MfDashMetaAtualizadasDto,
    MfDashMetaPendenteDto,
} from './dto/metas.dto';
import { MfPessoaAcessoPdm } from '../../mf.service';

class Arr {
    static mergeUnique(a: number[], b: number[]): number[] {
        const uniqueSet = new Set([...a, ...b]);
        return Array.from(uniqueSet);
    }
    static intersection(a: number[], b: number[]): number[] {
        const setA = new Set(a);
        return b.filter((element) => setA.has(element));
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
            perfil: config.perfil,
        };

        // padrão é puxar as metas do perfil da pessoa
        const metas = await this.aplicaFiltroMetas(params, [...config.metas_cronograma, ...config.metas_variaveis]);

        const renderStatus = (
            r: { meta: IdCodTituloDto } & MetaStatusConsolidadoCf
        ): MfDashMetaPendenteDto | MfDashMetaAtualizadasDto => {
            return {
                id: r.meta.id,
                codigo: r.meta.codigo,
                titulo: r.meta.titulo,
                analise_qualitativa_enviada: r.analise_qualitativa_enviada,
                fechamento_enviado: r.fechamento_enviado,
                risco_enviado: r.risco_enviado,
                variaveis: {
                    aguardando_complementacao: Arr.intersection(r.variaveis_aguardando_complementacao, config.variaveis)
                        .length,
                    conferidas: Arr.intersection(r.variaveis_conferidas, config.variaveis).length,
                    enviadas: Arr.intersection(r.variaveis_enviadas, config.variaveis).length,
                    preenchidas: Arr.intersection(r.variaveis_preenchidas, config.variaveis).length,
                    total: Arr.intersection(r.variaveis_total, config.variaveis).length,
                },
                cronograma: {
                    preenchido:
                        Arr.intersection(r.cronograma_total, config.cronogramas_etapas).length -
                        Arr.mergeUnique(
                            Arr.intersection(r.cronograma_atraso_fim, config.cronogramas_etapas),
                            Arr.intersection(r.cronograma_atraso_inicio, config.cronogramas_etapas)
                        ).length,
                    total: r.cronograma_total.length,
                },
                orcamento: {
                    preenchido: r.orcamento_preenchido.length,
                    total: r.orcamento_total.length,
                },
            };
        };

        let listaMetasPendentesPf: number[] = [];
        if ((params.retornar_pendentes || params.retornar_atualizadas) && ehPontoFocal)
            listaMetasPendentesPf = await this.metasPendentePontoFocal(config.pessoa_id);

        if (params.retornar_pendentes) {
            const pendentes = await this.prisma.metaStatusConsolidadoCf.findMany({
                where: {
                    ciclo_fisico_id: cicloFisicoId,
                    meta_id: metas ? { in: metas } : undefined,

                    pendente_cp: ehPontoFocal ? undefined : true,

                    AND: ehPontoFocal ? [{ meta_id: { in: listaMetasPendentesPf } }] : undefined,
                },
                include: {
                    meta: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                },
            });
            ret.pendentes = pendentes.map(renderStatus);
        }

        if (params.retornar_atualizadas) {
            const atualizadas = await this.prisma.metaStatusConsolidadoCf.findMany({
                where: {
                    ciclo_fisico_id: cicloFisicoId,
                    meta_id: metas ? { in: metas } : undefined,

                    pendente_cp: ehPontoFocal ? undefined : false,

                    AND: ehPontoFocal ? [{ meta_id: { notIn: listaMetasPendentesPf } }] : undefined,
                },
                include: {
                    meta: {
                        select: { id: true, codigo: true, titulo: true },
                    },
                },
            });
            ret.atualizadas = atualizadas.map(renderStatus);
        }

        return ret;
    }

    private async aplicaFiltroMetas(params: FilterMfDashMetasDto, metas: number[]) {
        const filterMetas = await this.prisma.meta.findMany({
            where: {
                removido_em: null,
                AND: params.visao_geral ? undefined : [{ id: { in: metas } }],
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

        metas = filterMetas.map((r) => r.id);
        return metas;
    }

    private async metasPendentePontoFocal(pessoaId: number): Promise<number[]> {
        const metasPendentes: { meta_id: number }[] = await this.prisma.$queryRaw`
        SELECT
            msc.meta_id
        FROM
            pessoa_acesso_pdm pap
            CROSS JOIN meta_status_consolidado_cf msc
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
                            bool_and(element = ANY (msc.variaveis_enviadas))
                        FROM
                            unnest(pf.variaveis_ponto_focal) AS element)
                        -- se o banco usar químicos ruins e voltar um negativo, o default é false
                    ELSE
                        FALSE
                END
            )
            OR
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
        )
    `;

        return metasPendentes.map((r) => r.meta_id);
    }
}
