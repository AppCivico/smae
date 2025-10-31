import { Injectable } from '@nestjs/common';
import { GeoBuscaService } from '../geo-busca/geo-busca.service';
import {
    SearchEntitiesNearbyDto as UnifiedSearchInputDto, //Renomeado pra evitar confusão com o DTO do GeoBusca
    SearchEntitiesNearbyResponseDto,
    GeoInfoBaseDto,
    PdmRotuloInfo,
    MetaIniAtvLookupInfoDto,
} from '../geo-busca/dto/geo-busca.entity';

import {
    UnifiedTableRowDto,
    UnifiedTableMetadadoDto,
    UnifiedTableResponseDto,
    UnifiedTableHeadersDto,
} from './dto/busca-global.entity';

enum UnifiedEntityType {
    PROJETO = 'projeto',
    OBRA = 'obra',
    META = 'meta',
    INICIATIVA = 'iniciativa',
    ATIVIDADE = 'atividade',
    ETAPA = 'etapa',
}

@Injectable()
export class BuscaGlobalService {
    constructor(private readonly geoBuscaService: GeoBuscaService) {}

    private getMainColumnAndSortDistance(localizacoes: GeoInfoBaseDto[]): {
        mainColumnText: string;
        sortDistance?: number;
    } {
        if (!localizacoes || localizacoes.length === 0) {
            return { mainColumnText: 'N/A', sortDistance: undefined };
        }

        let closestLocation: GeoInfoBaseDto | undefined = undefined;
        let minDistance = Infinity;

        for (const loc of localizacoes) {
            if (loc.distancia_metros !== undefined && loc.distancia_metros < minDistance) {
                minDistance = loc.distancia_metros;
                closestLocation = loc;
            }
        }

        if (!closestLocation && localizacoes.length > 0) {
            closestLocation = localizacoes[0]; // Fallback to first if no distance
        }

        if (!closestLocation) {
            return { mainColumnText: 'N/A', sortDistance: undefined };
        }

        let mainColumnText = closestLocation.endereco_exibicao;
        const sortDistance = closestLocation.distancia_metros;

        if (sortDistance !== undefined) {
            mainColumnText += `\n${Math.round(sortDistance)}m`;
        }
        return { mainColumnText, sortDistance };
    }

    private addMetadado(
        metadataArray: UnifiedTableMetadadoDto[],
        key: string,
        value: string | number | null | undefined
    ) {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
            metadataArray.push({ key, value: String(value) });
        }
    }

    async getUnifiedTableData(dto: UnifiedSearchInputDto): Promise<UnifiedTableResponseDto> {
        const headers: UnifiedTableHeadersDto = {
            mainColumn: 'Endereço',
            col1: 'Portfólio/Macro Tema',
            col2: 'Título',
            col3: 'Órgão',
            col4: 'Status',
            col5: 'Metadados', // Placeholder text for the column as per DTO
            dynamic_metadados: 'Detalhes', // Header for the column containing the array of metadata
        };

        const searchResults: SearchEntitiesNearbyResponseDto = await this.geoBuscaService.searchEntitiesNearby(dto);

        const allRows: UnifiedTableRowDto[] = [];
        let processingOrder = 0;

        const pdmInfoMap = new Map<number, PdmRotuloInfo>(searchResults.pdm_info.map((pdm) => [pdm.id, pdm]));
        const metaLookupMap = new Map<number, MetaIniAtvLookupInfoDto>(
            searchResults.metas_info.map((meta) => [meta.id, meta])
        );

        // PROJETOS
        for (const projeto of searchResults.projetos) {
            const { mainColumnText, sortDistance } = this.getMainColumnAndSortDistance(projeto.localizacoes);
            const dynamic_metadados: UnifiedTableMetadadoDto[] = [];
            this.addMetadado(dynamic_metadados, 'Código', projeto.codigo);
            this.addMetadado(dynamic_metadados, 'Empreendimento', projeto.empreendimento_identificador);
            this.addMetadado(dynamic_metadados, 'Equipamento', projeto.equipamento_nome);
            this.addMetadado(dynamic_metadados, 'Grupo Temático', projeto.grupo_tematico_nome);
            this.addMetadado(dynamic_metadados, 'Tipo Intervenção', projeto.tipo_intervencao_nome);
            this.addMetadado(dynamic_metadados, 'Subprefeituras', projeto.subprefeitura_nomes);

            allRows.push({
                row_id: `${UnifiedEntityType.PROJETO}-${projeto.id}`,
                modulo_sistema: 'Projetos',
                entity_id: projeto.id,
                mainColumn: mainColumnText,
                col1: projeto.portfolio_titulo,
                col2: projeto.nome,
                col3: projeto.orgao_responsavel_sigla ? [projeto.orgao_responsavel_sigla] : null,
                col4: projeto.status,
                col5: 'Metadados',
                dynamic_metadados,
                distancia_metros_sort: sortDistance,
                original_processing_order: processingOrder++,
            });
        }

        // OBRAS
        for (const obra of searchResults.obras) {
            const { mainColumnText, sortDistance } = this.getMainColumnAndSortDistance(obra.localizacoes);
            const dynamic_metadados: UnifiedTableMetadadoDto[] = [];
            this.addMetadado(dynamic_metadados, 'Código', obra.codigo);
            this.addMetadado(dynamic_metadados, 'Empreendimento', obra.empreendimento_identificador);
            this.addMetadado(dynamic_metadados, 'Equipamento', obra.equipamento_nome);
            this.addMetadado(dynamic_metadados, 'Grupo Temático', obra.grupo_tematico_nome);
            this.addMetadado(dynamic_metadados, 'Tipo Intervenção', obra.tipo_intervencao_nome);
            this.addMetadado(dynamic_metadados, 'Subprefeituras', obra.subprefeitura_nomes);

            allRows.push({
                row_id: `${UnifiedEntityType.OBRA}-${obra.id}`,
                modulo_sistema: 'MDO',
                entity_id: obra.id,
                mainColumn: mainColumnText,
                col1: obra.portfolio_titulo,
                col2: obra.nome,
                col3: obra.orgao_responsavel_sigla ? [obra.orgao_responsavel_sigla] : null,
                col4: obra.status,
                col5: 'Metadados',
                dynamic_metadados,
                distancia_metros_sort: sortDistance,
                original_processing_order: processingOrder++,
            });
        }

        // METAS, INICIATIVAS, ATIVIDADES, ETAPAS - Common logic for col1
        const getCol1ForMetaRelated = (metaInfo?: MetaIniAtvLookupInfoDto): string | null => {
            if (metaInfo?.pdm_id && metaInfo.macro_tema_nome) {
                const pdmRotulo = pdmInfoMap.get(metaInfo.pdm_id);
                if (pdmRotulo?.rotulo_macro_tema) {
                    return `${pdmRotulo.rotulo_macro_tema}: ${metaInfo.macro_tema_nome}`;
                }
                return metaInfo.macro_tema_nome; // Fallback if rotulo_macro_tema is missing
            }
            return metaInfo?.macro_tema_nome || null; // Only name if no PDM context or only name available
        };

        // METAS
        for (const metaEntry of searchResults.metas) {
            const { mainColumnText, sortDistance } = this.getMainColumnAndSortDistance(metaEntry.localizacoes);
            const metaInfo = metaLookupMap.get(metaEntry.id);
            const dynamic_metadados: UnifiedTableMetadadoDto[] = [];
            const pdmInfo = metaInfo?.pdm_id ? pdmInfoMap.get(metaInfo.pdm_id) : undefined;
            if (!pdmInfo) continue; // impossible to have a meta without PDM info

            this.addMetadado(dynamic_metadados, 'Código Meta', metaInfo?.codigo);

            allRows.push({
                row_id: `${UnifiedEntityType.META}-${metaEntry.id}`,
                modulo_sistema: pdmInfo.sistema,
                entity_id: metaEntry.id,
                mainColumn: mainColumnText,
                col1: getCol1ForMetaRelated(metaInfo),
                col2: metaInfo?.titulo || `Meta ID ${metaEntry.id}`,
                col3: metaInfo?.orgaos_sigla || null,
                col4: 'N/A',
                col5: 'Metadados',
                dynamic_metadados,
                distancia_metros_sort: sortDistance,
                original_processing_order: processingOrder++,
            });
        }

        // INICIATIVAS
        for (const iniciativa of searchResults.iniciativas) {
            const { mainColumnText, sortDistance } = this.getMainColumnAndSortDistance(iniciativa.localizacoes);
            const metaInfo = metaLookupMap.get(iniciativa.meta_id);
            const dynamic_metadados: UnifiedTableMetadadoDto[] = [];
            this.addMetadado(dynamic_metadados, 'Código Iniciativa', iniciativa.codigo);
            const pdmInfo = metaInfo?.pdm_id ? pdmInfoMap.get(metaInfo.pdm_id) : undefined;
            if (!pdmInfo) continue; // impossible to have a meta without PDM info

            if (metaInfo?.pdm_id) {
                const pdmRotulo = pdmInfoMap.get(metaInfo.pdm_id);
                if (pdmRotulo?.rotulo_iniciativa) {
                    this.addMetadado(dynamic_metadados, pdmRotulo.rotulo_iniciativa, iniciativa.titulo);
                } else {
                    this.addMetadado(dynamic_metadados, 'Iniciativa', iniciativa.titulo);
                }
            } else {
                this.addMetadado(dynamic_metadados, 'Iniciativa', iniciativa.titulo);
            }

            allRows.push({
                row_id: `${UnifiedEntityType.INICIATIVA}-${iniciativa.id}`,
                modulo_sistema: pdmInfo.sistema,
                entity_id: iniciativa.id,
                mainColumn: mainColumnText,
                col1: getCol1ForMetaRelated(metaInfo),
                col2: iniciativa.titulo,
                col3: iniciativa.orgaos_sigla || null,
                col4: 'N/A',
                col5: 'Metadados',
                dynamic_metadados,
                distancia_metros_sort: sortDistance,
                original_processing_order: processingOrder++,
            });
        }

        // ATIVIDADES
        for (const atividade of searchResults.atividades) {
            const { mainColumnText, sortDistance } = this.getMainColumnAndSortDistance(atividade.localizacoes);
            const metaInfo = metaLookupMap.get(atividade.meta_id);
            const dynamic_metadados: UnifiedTableMetadadoDto[] = [];
            this.addMetadado(dynamic_metadados, 'Código Atividade', atividade.codigo);
            this.addMetadado(dynamic_metadados, 'Iniciativa Relacionada', atividade.iniciativa_titulo);
            const pdmInfo = metaInfo?.pdm_id ? pdmInfoMap.get(metaInfo.pdm_id) : undefined;
            if (!pdmInfo) continue; // impossible to have a meta without PDM info

            if (metaInfo?.pdm_id) {
                const pdmRotulo = pdmInfoMap.get(metaInfo.pdm_id);
                if (pdmRotulo?.rotulo_atividade) {
                    this.addMetadado(dynamic_metadados, pdmRotulo.rotulo_atividade, atividade.titulo);
                } else {
                    this.addMetadado(dynamic_metadados, 'Atividade', atividade.titulo); // Fallback key
                }
            } else {
                this.addMetadado(dynamic_metadados, 'Atividade', atividade.titulo);
            }

            allRows.push({
                row_id: `${UnifiedEntityType.ATIVIDADE}-${atividade.id}`,
                modulo_sistema: pdmInfo.sistema,
                entity_id: atividade.id,
                mainColumn: mainColumnText,
                col1: getCol1ForMetaRelated(metaInfo),
                col2: atividade.titulo,
                col3: atividade.orgaos_sigla || null,
                col4: 'N/A',
                col5: 'Metadados',
                dynamic_metadados,
                distancia_metros_sort: sortDistance,
                original_processing_order: processingOrder++,
            });
        }

        // ETAPAS
        for (const etapa of searchResults.etapas) {
            const { mainColumnText, sortDistance } = this.getMainColumnAndSortDistance(etapa.localizacoes);
            const metaInfo = metaLookupMap.get(etapa.meta_id); // Etapa.meta_id can be 0 if not linked
            const dynamic_metadados: UnifiedTableMetadadoDto[] = [];
            this.addMetadado(dynamic_metadados, 'Cronograma ID', etapa.cronograma_id);
            this.addMetadado(dynamic_metadados, 'Etapa', etapa.titulo || `Etapa ID ${etapa.id}`);
            const pdmInfo = metaInfo?.pdm_id ? pdmInfoMap.get(metaInfo.pdm_id) : undefined;
            if (!pdmInfo) continue; // impossible to have a meta without PDM info

            allRows.push({
                row_id: `${UnifiedEntityType.ETAPA}-${etapa.id}`,
                modulo_sistema: pdmInfo.sistema,
                entity_id: etapa.id,
                mainColumn: mainColumnText,
                col1: getCol1ForMetaRelated(metaInfo),
                col2: etapa.titulo || `Etapa ID ${etapa.id}`,
                col3: metaInfo?.orgaos_sigla || null,
                col4: 'N/A',
                col5: 'Metadados',
                dynamic_metadados,
                distancia_metros_sort: sortDistance,
                original_processing_order: processingOrder++,
            });
        }

        // Sort rows
        allRows.sort((a, b) => {
            const aHasDistance = a.distancia_metros_sort !== undefined;
            const bHasDistance = b.distancia_metros_sort !== undefined;

            if (aHasDistance && bHasDistance) {
                // If both have distance, sort by distance. If distances are equal, maintain original order.
                if (a.distancia_metros_sort! !== b.distancia_metros_sort!) {
                    return a.distancia_metros_sort! - b.distancia_metros_sort!;
                }
                return a.original_processing_order - b.original_processing_order;
            }
            if (aHasDistance) return -1;
            if (bHasDistance) return 1;

            return a.original_processing_order - b.original_processing_order;
        });

        return { headers, rows: allRows };
    }
}
