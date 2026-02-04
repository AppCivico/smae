import { Injectable, Logger } from '@nestjs/common';
import { DemandaFinalidade, DemandaStatus } from '@prisma/client';
import { CacheKVService } from '../../common/services/cache-kv.service';
import { SmaeConfigService } from '../../common/services/smae-config.service';
import { FindGeoEnderecoReferenciaDto } from '../../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../../geo-loc/geo-loc.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BuildArquivoBaseDto, PrismaArquivoComPreviewSelect } from '../../upload/arquivo-preview.helper';
import { UploadService } from '../../upload/upload.service';
import { TaskableService } from '../entities/task.entity';
import { TaskContext } from '../task.context';
import { CreateRefreshDemandaDto } from './dto/create-refresh-demanda.dto';

interface RefreshResult {
    success?: boolean;
    skipped?: boolean;
    reason?: string;
    count?: number;
    error?: string;
}

interface PublicDemandaItem {
    id: number;
    nome_projeto: string;
    descricao: string;
    justificativa: string;
    valor: string;
    finalidade: DemandaFinalidade;
    observacao: string | null;
    gestor_municipal: { id: number; nome_exibicao: string };
    area_tematica: { id: number; nome: string };
    geolocalizacao: any[];
}

@Injectable()
export class RefreshDemandaService implements TaskableService {
    private readonly logger = new Logger(RefreshDemandaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cacheKvService: CacheKVService,
        private readonly geolocService: GeoLocService,
        private readonly uploadService: UploadService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    async executeJob(params: CreateRefreshDemandaDto, taskId: string, _context?: TaskContext): Promise<any> {
        this.logger.log(`Iniciando refresh_demanda task ${taskId}`);
        const results: Record<string, RefreshResult> = {};

        try {
            if (params.demanda_id) {
                results.individual = await this.refreshIndividualDemanda(params.demanda_id);
                return { results };
            }

            if (params.cache_type) {
                switch (params.cache_type) {
                    case 'geocamadas':
                        results.geocamadas = await this.refreshGeocamadas(params.force_geocamadas || false);
                        break;
                    case 'summary':
                        results.summary = await this.refreshSummary();
                        break;
                    case 'full':
                        results.full = await this.refreshFull();
                        break;
                    case 'individual':
                        results.individual = await this.refreshAllIndividualDemandas();
                        break;
                    case 'geopoints':
                        results.geopoints = await this.refreshGeopoints();
                        break;
                }
                return { results };
            }

            results.geocamadas = await this.refreshGeocamadas(params.force_all || params.force_geocamadas || false);
            results.geopoints = await this.refreshGeopoints();
            results.summary = await this.refreshSummary();
            results.full = await this.refreshFull();
            results.individual = await this.refreshAllIndividualDemandas();

            return { results };
        } catch (error: any) {
            this.logger.error(`Erro na task ${taskId}: ${error.message}`, error.stack);
            throw error;
        }
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        return JSON.stringify(executeOutput) as any;
    }

    private async refreshGeocamadas(force: boolean): Promise<RefreshResult> {
        const cacheKey = 'demandas:geocamadas';

        if (!force && (await this.cacheKvService.get(cacheKey))) {
            return { skipped: true, reason: 'Cache ja existe' };
        }

        const regiaoId = await this.smaeConfigService.getConfigNumberWithDefault('DEMANDA_GEOCAMADAS_REGIAO_ID', 180);
        const nivel = await this.smaeConfigService.getConfigNumberWithDefault('DEMANDA_GEOCAMADAS_NIVEL', 3);

        try {
            const geocamadas = await this.geolocService.buscaCamadas({
                filha_de_regiao_id: regiaoId,
                regiao_nivel_regionalizacao: nivel,
                retornar_regioes: true,
            });

            await this.cacheKvService.set(cacheKey, {
                refreshed_at: new Date().toISOString(),
                data: geocamadas,
            });

            return { success: true, count: geocamadas.length };
        } catch (error: any) {
            this.logger.error(`Falha ao refresh geocamadas: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    private async refreshGeopoints(): Promise<RefreshResult> {
        const demandas = await this.prisma.demanda.findMany({
            where: { status: DemandaStatus.Publicado, removido_em: null },
            select: { id: true },
        });

        const geoReferencias = await this.loadGeolocalizationForDemandas(demandas.map((d) => d.id));

        const geopoints = demandas
            .map((d) => {
                const refs = geoReferencias.get(d.id) || [];
                const geo = refs.find((r: any) => r.latitude && r.longitude);
                return {
                    id: d.id,
                    latitude: geo?.latitude ?? null,
                    longitude: geo?.longitude ?? null,
                };
            })
            .filter((p) => p.latitude !== null && p.longitude !== null);

        await this.cacheKvService.set('demandas:geopoints', {
            refreshed_at: new Date().toISOString(),
            total: geopoints.length,
            points: geopoints,
        });

        this.logger.log(`GeoPoints: ${geopoints.length} pontos cacheados`);
        return { success: true, count: geopoints.length };
    }

    private async refreshSummary(): Promise<RefreshResult> {
        const demandas = await this.loadPublishedDemandas();
        const geoMap = await this.loadGeolocalizationForDemandas(demandas.map((d) => d.id));
        const filters = this.buildFilters(demandas, geoMap);

        await this.cacheKvService.set('demandas:summary', {
            refreshed_at: new Date().toISOString(),
            total_count: demandas.length,
            recent_demandas: demandas.slice(0, 10).map((d) => ({
                ...this.mapToPublicItem(d),
                geolocalizacao: geoMap.get(d.id) || [],
            })),
            filters,
        });

        return { success: true, count: demandas.length };
    }

    private async refreshFull(): Promise<RefreshResult> {
        const demandas = await this.loadPublishedDemandas();
        const geoMap = await this.loadGeolocalizationForDemandas(demandas.map((d) => d.id));
        const filters = this.buildFilters(demandas, geoMap);

        await this.cacheKvService.set('demandas:full', {
            refreshed_at: new Date().toISOString(),
            total_count: demandas.length,
            demandas: demandas.map((d) => ({
                ...this.mapToPublicItem(d),
                geolocalizacao: geoMap.get(d.id) || [],
            })),
            filters,
        });

        return { success: true, count: demandas.length };
    }

    private async refreshAllIndividualDemandas(): Promise<RefreshResult> {
        const demandas = await this.loadPublishedDemandasWithFiles();
        let count = 0;

        for (const demanda of demandas) {
            await this.refreshIndividualDemanda(demanda.id, demanda);
            count++;
        }

        return { success: true, count };
    }

    async refreshIndividualDemanda(demandaId: number, preloadedDemanda?: any): Promise<RefreshResult> {
        const cacheKey = `demandas:${demandaId}`;
        const demanda = preloadedDemanda || (await this.loadSinglePublishedDemanda(demandaId));

        if (!demanda) {
            await this.cacheKvService.setDeleted(cacheKey);
            return { success: true, reason: 'Marcado como deletado' };
        }

        const geoDto = new FindGeoEnderecoReferenciaDto();
        geoDto.demanda_id = demandaId;
        const geoReferencias = await this.geolocService.carregaReferencias(geoDto);
        const geolocalizacao = geoReferencias.get(demandaId) || [];

        const fileExpiry = await this.smaeConfigService.getConfigWithDefault(
            'DEMANDA_PUBLIC_FILE_TOKEN_EXPIRY',
            '365d'
        );

        await this.cacheKvService.set(cacheKey, {
            refreshed_at: new Date().toISOString(),
            demanda: {
                id: demanda.id,
                nome_projeto: demanda.nome_projeto,
                descricao: demanda.descricao,
                justificativa: demanda.justificativa,
                valor: demanda.valor.toString(),
                finalidade: demanda.finalidade,
                observacao: demanda.observacao,
                gestor_municipal: {
                    id: demanda.orgao.id,
                    nome_exibicao: `${demanda.orgao.sigla} - ${demanda.orgao.descricao}`,
                },
                area_tematica: demanda.area_tematica,
                acoes: demanda.acoes?.map((a: any) => a.acao) || [],
                geolocalizacao,
                arquivos: demanda.arquivos
                    ?.filter((a: any) => a.autoriza_divulgacao === true)
                    .slice(0, 3)
                    .map((a: any) => ({
                        id: a.id,
                        descricao: a.descricao,
                        arquivo: BuildArquivoBaseDto(a.arquivo, (id, _exp) =>
                            this.uploadService.getPublicDownloadToken(id, fileExpiry)
                        ),
                    })),
            },
        });

        return { success: true };
    }

    private async loadPublishedDemandas(): Promise<any[]> {
        return this.prisma.demanda.findMany({
            where: { status: DemandaStatus.Publicado, removido_em: null },
            orderBy: { data_publicado: 'desc' },
            select: {
                id: true,
                nome_projeto: true,
                descricao: true,
                justificativa: true,
                valor: true,
                finalidade: true,
                observacao: true,
                orgao: { select: { id: true, sigla: true, descricao: true } },
                area_tematica: { select: { id: true, nome: true } },
            },
        });
    }

    private async loadPublishedDemandasWithFiles(): Promise<any[]> {
        return this.prisma.demanda.findMany({
            where: { status: DemandaStatus.Publicado, removido_em: null },
            select: {
                id: true,
                nome_projeto: true,
                descricao: true,
                justificativa: true,
                valor: true,
                finalidade: true,
                observacao: true,
                orgao: { select: { id: true, sigla: true, descricao: true } },
                area_tematica: { select: { id: true, nome: true } },
                acoes: {
                    where: { removido_em: null },
                    select: { acao: { select: { id: true, nome: true } } },
                },
                arquivos: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        autoriza_divulgacao: true,
                        descricao: true,
                        arquivo: { select: PrismaArquivoComPreviewSelect },
                    },
                    orderBy: [{ autoriza_divulgacao: 'desc' }, { descricao: 'asc' }],
                },
            },
        });
    }

    private async loadSinglePublishedDemanda(id: number): Promise<any | null> {
        return this.prisma.demanda.findFirst({
            where: { id, status: DemandaStatus.Publicado, removido_em: null },
            select: {
                id: true,
                nome_projeto: true,
                descricao: true,
                justificativa: true,
                valor: true,
                finalidade: true,
                observacao: true,
                orgao: { select: { id: true, sigla: true, descricao: true } },
                area_tematica: { select: { id: true, nome: true } },
                acoes: {
                    where: { removido_em: null },
                    select: { acao: { select: { id: true, nome: true } } },
                },
                arquivos: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        autoriza_divulgacao: true,
                        descricao: true,
                        arquivo: { select: PrismaArquivoComPreviewSelect },
                    },
                    orderBy: [{ autoriza_divulgacao: 'desc' }, { descricao: 'asc' }],
                },
            },
        });
    }

    private async loadGeolocalizationForDemandas(demandaIds: number[]): Promise<Map<number, any[]>> {
        if (demandaIds.length === 0) return new Map();

        const geoDto = new FindGeoEnderecoReferenciaDto();
        geoDto.demanda_id = demandaIds;
        return this.geolocService.carregaReferencias(geoDto);
    }

    private buildFilters(demandas: any[], geoMap: Map<number, any[]>): any {
        const orgaosMap = new Map<number, { id: number; nome_exibicao: string }>();
        const areasMap = new Map<number, { id: number; nome: string }>();
        const subprefMap = new Map<number, { id: number; descricao: string }>();
        const distritosMap = new Map<number, { id: number; descricao: string }>();
        let minValor = Infinity;
        let maxValor = -Infinity;

        for (const d of demandas) {
            if (!orgaosMap.has(d.orgao.id)) {
                orgaosMap.set(d.orgao.id, {
                    id: d.orgao.id,
                    nome_exibicao: `${d.orgao.sigla} - ${d.orgao.descricao}`,
                });
            }

            if (!areasMap.has(d.area_tematica.id)) {
                areasMap.set(d.area_tematica.id, d.area_tematica);
            }

            const valor = parseFloat(d.valor.toString());
            if (valor < minValor) minValor = valor;
            if (valor > maxValor) maxValor = valor;

            const geo = geoMap.get(d.id) || [];
            for (const g of geo) {
                g.regioes?.nivel_3?.forEach((r: any) => {
                    if (!subprefMap.has(r.id)) subprefMap.set(r.id, r);
                });
                g.regioes?.nivel_4?.forEach((r: any) => {
                    if (!distritosMap.has(r.id)) distritosMap.set(r.id, r);
                });
            }
        }

        return {
            orgaos: Array.from(orgaosMap.values()).sort((a, b) => a.nome_exibicao.localeCompare(b.nome_exibicao)),
            areas_tematicas: Array.from(areasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome)),
            localizacoes: {
                subprefeituras: Array.from(subprefMap.values()).sort((a, b) => a.descricao.localeCompare(b.descricao)),
                distritos: Array.from(distritosMap.values()).sort((a, b) => a.descricao.localeCompare(b.descricao)),
            },
            valor_range: {
                min: minValor === Infinity ? '0' : minValor.toString(),
                max: maxValor === -Infinity ? '0' : maxValor.toString(),
            },
        };
    }

    private mapToPublicItem(d: any): PublicDemandaItem {
        return {
            id: d.id,
            nome_projeto: d.nome_projeto,
            descricao: d.descricao,
            justificativa: d.justificativa,
            valor: d.valor.toString(),
            finalidade: d.finalidade,
            observacao: d.observacao,
            gestor_municipal: {
                id: d.orgao.id,
                nome_exibicao: `${d.orgao.sigla} - ${d.orgao.descricao}`,
            },
            area_tematica: d.area_tematica,
            geolocalizacao: [],
        };
    }
}
