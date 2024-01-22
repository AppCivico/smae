import { BadRequestException, Injectable } from '@nestjs/common';
import { MetaStatusConsolidadoCf } from '@prisma/client';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { FilterMfDashMetasDto, ListMfDashMetasDto } from './dto/metas.dto';
import { MfPessoaAcessoPdm } from '../../mf.service';

@Injectable()
export class MfDashMetasService {
    constructor(private readonly prisma: PrismaService) {}

    async metas(
        config: MfPessoaAcessoPdm,
        cicloFisicoId: number,
        params: FilterMfDashMetasDto
    ): Promise<ListMfDashMetasDto> {
        const ehPontoFocal = config.perfil === 'ponto_focal';
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
        let metas = [...config.metas_cronograma, ...config.metas_variaveis];

        if (params.coordenadores_cp || params.orgaos || params.metas) {
            metas = await this.aplicaFiltroMetas(params, metas);
        }
        const renderStatus = (r: { meta: IdCodTituloDto } & MetaStatusConsolidadoCf) => {
            return {
                id: r.meta.id,
                codigo: r.meta.codigo,
                titulo: r.meta.titulo,
                analise_qualitativa_enviada: r.analise_qualitativa_enviada,
                fechamento_enviado: r.fechamento_enviado,
                risco_enviado: r.risco_enviado,
                variaveis: {
                    aguardando_complementacao: r.variaveis_aguardando_complementacao.length,
                    aguardando_cp: r.variaveis_aguardando_cp.length,
                    conferidas: r.variaveis_conferidas.length,
                    enviadas: r.variaveis_enviadas.length,
                    preenchidas: r.variaveis_preenchidas.length,
                    total: r.variaveis_total.length,
                },
                cronograma: {
                    preenchido: r.cronograma_preenchido.length,
                    total: r.cronograma_total.length,
                },
                orcamento: {
                    preenchido: r.orcamento_preenchido.length,
                    total: r.orcamento_total.length,
                },
            };
        };

        if (params.retornar_pendentes) {
            const pendentes = await this.prisma.metaStatusConsolidadoCf.findMany({
                where: {
                    ciclo_fisico_id: cicloFisicoId,
                    meta_id: metas ? { in: metas } : undefined,

                    pendente_cp: ehPontoFocal ? true : undefined,
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

                    pendente_cp: ehPontoFocal ? false : undefined,
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
                              id: { in: params.coordenadores_cp },
                          },
                      }
                    : undefined,

                meta_orgao: params.orgaos
                    ? {
                          some: {
                              id: { in: params.orgaos },
                          },
                      }
                    : undefined,
            },
            select: { id: true },
        });

        metas = filterMetas.map((r) => r.id);
        return metas;
    }
}
