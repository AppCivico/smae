import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoProjeto } from '@prisma/client'; // Added Prisma
import { GeoJSON } from 'geojson';

import { PrismaService } from '../prisma/prisma.service';
import {
    GeoInfoBaseDto,
    ProjetoSearchResultDto,
    SearchEntitiesNearbyDto,
    SearchEntitiesNearbyResponseDto,
} from './dto/geo-busca.entity';

const MAX_RESULTS_GEOLOC = 1000; // Max GeoLocalizacao records to fetch initially

@Injectable()
export class GeoBuscaService {
    constructor(private readonly prisma: PrismaService) {}

    async searchEntitiesNearby(dto: SearchEntitiesNearbyDto): Promise<SearchEntitiesNearbyResponseDto> {
        const { lat, lon, raio_km = 2, regiao_id, geo_camada_config_id, geo_camada_codigo } = dto;

        const radiusMeters = raio_km * 1000;
        let targetGeoLocalizacaoIds: number[] = [];
        let geoLocalizacaoDistMap: Map<number, number> | undefined = undefined;
        const seenPDMIds = new Set<number>();
        const seenMetaIdsForLookup = new Set<number>();

        const hasDistrito = geo_camada_config_id !== undefined && geo_camada_codigo !== undefined;
        const hasRegiao = regiao_id !== undefined;
        const hasPonto = lat !== undefined && lon !== undefined;
        const modosSelecionados = [hasDistrito, hasRegiao, hasPonto].filter(Boolean).length;

        if (modosSelecionados === 0) {
            throw new BadRequestException(
                'Forneça um dos seguintes modos de busca: (1) geo_camada_config_id + geo_camada_codigo, (2) regiao_id, ou (3) lat + lon.'
            );
        }
        if (modosSelecionados > 1) {
            throw new BadRequestException(
                'Forneça apenas um modo de busca: (1) geo_camada_config_id + geo_camada_codigo, (2) regiao_id, ou (3) lat + lon.'
            );
        }
        if (
            (geo_camada_config_id !== undefined && geo_camada_codigo === undefined) ||
            (geo_camada_config_id === undefined && geo_camada_codigo !== undefined)
        ) {
            throw new BadRequestException(
                'Para busca por distrito/subprefeitura, forneça ambos: geo_camada_config_id e geo_camada_codigo.'
            );
        }

        if (hasDistrito) {
            const localizacoesInDistrict = await this.prisma.geoLocalizacao.findMany({
                where: {
                    GeoEnderecoCamada: {
                        some: {
                            geo_camada: {
                                geo_camada_config: geo_camada_config_id,
                                codigo: geo_camada_codigo,
                            },
                        },
                    },
                },
                select: { id: true },
                orderBy: { criado_em: 'desc' },
                take: MAX_RESULTS_GEOLOC,
            });
            if (localizacoesInDistrict.length === 0 && geo_camada_codigo && geo_camada_config_id) {
                throw new NotFoundException(
                    `Código de camada "${geo_camada_codigo}" não encontrado na camada de configuração com ID ${geo_camada_config_id}.`
                );
            }
            targetGeoLocalizacaoIds = localizacoesInDistrict.map((gl) => gl.id);
        } else if (hasRegiao && regiao_id) {
            const localizacoesInRegiao = await this.prisma.geoLocalizacao.findMany({
                where: {
                    GeoEnderecoCamada: {
                        some: {
                            geo_camada: {
                                GeoCamadaRegiao: {
                                    some: {
                                        regiao_id: regiao_id,
                                    },
                                },
                            },
                        },
                    },
                },
                select: { id: true },
                orderBy: { criado_em: 'desc' },
                take: MAX_RESULTS_GEOLOC,
            });
            if (localizacoesInRegiao.length === 0) {
                throw new NotFoundException(`Nenhuma geolocalização encontrada para a região com ID ${regiao_id}.`);
            }
            targetGeoLocalizacaoIds = localizacoesInRegiao.map((gl) => gl.id);
        } else if (hasPonto && lat !== undefined && lon !== undefined) {
            const results: { id: number; distancia_metros: number }[] = await this.prisma.$queryRaw(
                Prisma.sql`
                SELECT id,
                       earth_distance(ll_to_earth(${lat}, ${lon}), ll_to_earth(lat, lon)) AS distancia_metros
                FROM geo_localizacao
                WHERE tipo = 'Endereco'::"GeoReferenciaTipo"
                  AND earth_box(ll_to_earth(${lat}, ${lon}), ${radiusMeters}) @> ll_to_earth(lat, lon)
                  AND earth_distance(ll_to_earth(${lat}, ${lon}), ll_to_earth(lat, lon)) <= ${radiusMeters}
                ORDER BY distancia_metros ASC
                LIMIT ${MAX_RESULTS_GEOLOC}
            `
            );
            targetGeoLocalizacaoIds = results.map((r) => r.id);
            geoLocalizacaoDistMap = new Map<number, number>();
            results.forEach((r) => geoLocalizacaoDistMap!.set(r.id, r.distancia_metros));
        }

        if (targetGeoLocalizacaoIds.length === 0) {
            return {
                projetos: [],
                obras: [],
                metas: [],
                iniciativas: [],
                atividades: [],
                etapas: [],
                pdm_info: [],
                metas_info: [],
            }; // Initialized metas_info
        }

        const referencias = await this.prisma.geoLocalizacaoReferencia.findMany({
            where: {
                geo_localizacao_id: { in: targetGeoLocalizacaoIds },
                removido_em: null,
            },
            include: {
                geo_localizacao: true,
            },
        });

        if (referencias.length === 0) {
            return {
                projetos: [],
                obras: [],
                metas: [],
                iniciativas: [],
                atividades: [],
                etapas: [],
                pdm_info: [],
                metas_info: [],
            }; // Initialized metas_info
        }

        const response: SearchEntitiesNearbyResponseDto = {
            projetos: [],
            obras: [],
            metas: [],
            iniciativas: [],
            atividades: [],
            etapas: [],
            pdm_info: [],
            metas_info: [],
        };

        const makeGeoInfo = (ref: (typeof referencias)[0]): GeoInfoBaseDto => {
            const geoInfo: GeoInfoBaseDto = {
                geo_localizacao_id: ref.geo_localizacao_id,
                endereco_exibicao: ref.geo_localizacao.endereco_exibicao,
                lat: ref.geo_localizacao.lat,
                lon: ref.geo_localizacao.lon,
                tipo_referencia: ref.geo_localizacao.tipo,
                geom_geojson: ref.geo_localizacao.geom_geojson?.valueOf() as GeoJSON,
            };
            // Se busca foi por lat/lon, adiciona a distância
            if (typeof geoLocalizacaoDistMap !== 'undefined' && geoLocalizacaoDistMap.has(ref.geo_localizacao_id)) {
                geoInfo.distancia_metros = geoLocalizacaoDistMap.get(ref.geo_localizacao_id);
            }
            return geoInfo;
        };

        const entityGeoInfoMap = new Map<string, GeoInfoBaseDto[]>();
        const addGeoInfoToMap = (entityType: string, entityId: number, geoInfo: GeoInfoBaseDto) => {
            const key = `${entityType}-${entityId}`;
            let infos = entityGeoInfoMap.get(key);
            if (!infos) {
                infos = [];
                entityGeoInfoMap.set(key, infos);
            }
            if (!infos.find((gi) => gi.geo_localizacao_id === geoInfo.geo_localizacao_id)) {
                infos.push(geoInfo);
            }
        };

        referencias.forEach((ref) => {
            const geoInfo = makeGeoInfo(ref);
            if (ref.projeto_id) addGeoInfoToMap('projeto', ref.projeto_id, geoInfo);
            if (ref.meta_id) addGeoInfoToMap('meta', ref.meta_id, geoInfo);
            if (ref.iniciativa_id) addGeoInfoToMap('iniciativa', ref.iniciativa_id, geoInfo);
            if (ref.atividade_id) addGeoInfoToMap('atividade', ref.atividade_id, geoInfo);
            if (ref.etapa_id) addGeoInfoToMap('etapa', ref.etapa_id, geoInfo);
        });

        // Fetch entities

        // Projetos e Obras
        const projetoIds = [...new Set(referencias.filter((r) => r.projeto_id).map((r) => r.projeto_id!))];
        if (projetoIds.length > 0) {
            const projetosFromView = await this.prisma.viewProjetoV2.findMany({
                where: {
                    id: { in: projetoIds },
                    projeto: { removido_em: null },
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
                    projeto: { select: { tipo: true, status: true } },
                },
            });

            projetosFromView.forEach((p) => {
                const geoInfos = entityGeoInfoMap.get(`projeto-${p.id}`) || [];

                const projetoDto: ProjetoSearchResultDto = {
                    id: p.id,
                    nome: p.nome,
                    codigo: p.codigo,
                    portfolio_id: p.portfolio_id,
                    portfolio_titulo: p.portfolio_titulo,
                    tipo: p.projeto.tipo,
                    status: p.projeto.status,
                    grupo_tematico_id: p.grupo_tematico_id,
                    grupo_tematico_nome: p.grupo_tematico_nome,
                    tipo_intervencao_id: p.tipo_intervencao_id,
                    tipo_intervencao_nome: p.tipo_intervencao_nome,
                    equipamento_id: p.equipamento_id,
                    equipamento_nome: p.equipamento_nome,
                    empreendimento_id: p.empreendimento_id,
                    empreendimento_nome: p.empreendimento_nome,
                    empreendimento_identificador: p.empreendimento_identificador,
                    subprefeitura_nomes: p.regioes,
                    orgao_responsavel_id: p.orgao_responsavel_id,
                    orgao_responsavel_sigla: p.orgao_responsavel_sigla,
                    orgao_responsavel_descricao: p.orgao_responsavel_descricao,
                    localizacoes: geoInfos,
                };
                if (p.projeto.tipo === TipoProjeto.MDO) {
                    response.obras.push(projetoDto);
                } else {
                    response.projetos.push(projetoDto);
                }
            });
        }

        // Metas
        const metaIds = [...new Set(referencias.filter((r) => r.meta_id).map((r) => r.meta_id!))];
        if (metaIds.length > 0) {
            const metasData = await this.prisma.meta.findMany({
                where: { id: { in: metaIds }, ativo: true, removido_em: null },
                select: {
                    id: true,
                },
            });
            metasData.forEach((m) => {
                seenMetaIdsForLookup.add(m.id); // Ensure meta_id is added for metas_info lookup
                response.metas.push({
                    id: m.id,
                    localizacoes: entityGeoInfoMap.get(`meta-${m.id}`) || [],
                });
            });
        }

        // Iniciativas
        const iniciativaIds = [...new Set(referencias.filter((r) => r.iniciativa_id).map((r) => r.iniciativa_id!))];
        if (iniciativaIds.length > 0) {
            const iniciativasData = await this.prisma.iniciativa.findMany({
                where: { id: { in: iniciativaIds }, ativo: true, removido_em: null },
                select: {
                    id: true,
                    titulo: true,
                    codigo: true,
                    meta: { select: { id: true, pdm_id: true } },
                    iniciativa_orgao: { select: { orgao: { select: { sigla: true } } } },
                },
            });
            iniciativasData.forEach((i) => {
                seenMetaIdsForLookup.add(i.meta.id);
                response.iniciativas.push({
                    id: i.id,
                    titulo: i.titulo,
                    codigo: i.codigo,
                    meta_id: i.meta.id,
                    pdm_id: i.meta.pdm_id,
                    orgaos_sigla: i.iniciativa_orgao.map((io) => io.orgao.sigla),
                    localizacoes: entityGeoInfoMap.get(`iniciativa-${i.id}`) || [],
                });
            });
        }

        // Atividades
        const atividadeIds = [...new Set(referencias.filter((r) => r.atividade_id).map((r) => r.atividade_id!))];
        if (atividadeIds.length > 0) {
            const atividadesData = await this.prisma.atividade.findMany({
                where: { id: { in: atividadeIds }, ativo: true, removido_em: null },
                select: {
                    id: true,
                    titulo: true,
                    codigo: true,
                    iniciativa: {
                        select: {
                            id: true,
                            titulo: true,
                            meta: { select: { id: true, pdm_id: true } },
                        },
                    },
                    atividade_orgao: { select: { orgao: { select: { sigla: true } } } },
                },
            });
            atividadesData.forEach((a) => {
                seenMetaIdsForLookup.add(a.iniciativa.meta.id);
                response.atividades.push({
                    id: a.id,
                    titulo: a.titulo,
                    codigo: a.codigo,
                    iniciativa_id: a.iniciativa.id,
                    iniciativa_titulo: a.iniciativa.titulo,
                    meta_id: a.iniciativa.meta.id,
                    pdm_id: a.iniciativa.meta.pdm_id,
                    orgaos_sigla: a.atividade_orgao.map((ao) => ao.orgao.sigla),
                    localizacoes: entityGeoInfoMap.get(`atividade-${a.id}`) || [],
                });
            });
        }

        // Etapas
        const etapaIds = [...new Set(referencias.filter((r) => r.etapa_id).map((r) => r.etapa_id!))];
        if (etapaIds.length > 0) {
            const etapasData = await this.prisma.etapa.findMany({
                where: { id: { in: etapaIds }, removido_em: null },
                select: { id: true, titulo: true, cronograma_id: true },
            });

            const etapaRelMetas = await this.prisma.view_etapa_rel_meta.findMany({
                where: { etapa_id: { in: etapasData.map((e) => e.id) } },
                select: { etapa_id: true, meta_id: true },
            });
            const etapaToMetaIdMap = new Map(etapaRelMetas.map((erm) => [erm.etapa_id, erm.meta_id]));

            const uniqueMetaIdsFromEtapas = [
                ...new Set(etapaRelMetas.map((erm) => erm.meta_id).filter((id) => id != null)),
            ] as number[];

            uniqueMetaIdsFromEtapas.forEach((id) => seenMetaIdsForLookup.add(id));

            etapasData.forEach((e) => {
                const metaId = etapaToMetaIdMap.get(e.id);

                response.etapas.push({
                    id: e.id,
                    titulo: e.titulo ?? `Etapa ID ${e.id}`,
                    cronograma_id: e.cronograma_id,
                    meta_id: metaId ?? 0,
                    localizacoes: entityGeoInfoMap.get(`etapa-${e.id}`) || [],
                });
            });
        }

        // Busca informações adicionais de metas e PDMs
        if (seenMetaIdsForLookup.size > 0) {
            const metasForInfoData = await this.prisma.meta.findMany({
                where: { id: { in: Array.from(seenMetaIdsForLookup) } },
                select: {
                    id: true,
                    codigo: true,
                    titulo: true,
                    pdm_id: true, // Ensure pdm_id is selected
                    meta_orgao: { select: { orgao: { select: { sigla: true } } } },
                },
            });
            response.metas_info = metasForInfoData.map((m) => {
                if (m.pdm_id) seenPDMIds.add(m.pdm_id);

                return {
                    id: m.id,
                    codigo: m.codigo,
                    titulo: m.titulo,
                    pdm_id: m.pdm_id,
                    orgaos_sigla: m.meta_orgao.map((mo) => mo.orgao.sigla),
                };
            });
        }

        // Busca os PDM Rótulos
        if (seenPDMIds.size > 0) {
            response.pdm_info = await this.prisma.pdm.findMany({
                where: { id: { in: Array.from(seenPDMIds) } },
                select: { id: true, rotulo_atividade: true, rotulo_iniciativa: true },
            });
        }

        return response;
    }
}
