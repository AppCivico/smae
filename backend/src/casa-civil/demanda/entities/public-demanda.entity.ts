import { ApiProperty } from '@nestjs/swagger';
import { DemandaFinalidade } from '@prisma/client';

export class PublicOrgaoDto {
    id: number;
    nome_exibicao: string;
}

export class PublicAreaTematicaDto {
    id: number;
    nome: string;
}

export class PublicRegiaoDto {
    id: number;
    descricao: string;
}

export class PublicLocalizacoesFilterDto {
    subprefeituras: PublicRegiaoDto[];
    distritos: PublicRegiaoDto[];
}

export class PublicValorRangeDto {
    min: string;
    max: string;
}

export class PublicFiltersDto {
    orgaos: PublicOrgaoDto[];
    areas_tematicas: PublicAreaTematicaDto[];
    localizacoes: PublicLocalizacoesFilterDto;
    valor_range: PublicValorRangeDto;
}

export class PublicDemandaItemDto {
    id: number;
    nome_projeto: string;
    descricao: string;
    justificativa: string;
    valor: string;
    @ApiProperty({ enum: DemandaFinalidade })
    finalidade: DemandaFinalidade;
    observacao: string | null;
    gestor_municipal: PublicOrgaoDto;
    area_tematica: PublicAreaTematicaDto;
    geolocalizacao: any[];
}

export class PublicDemandaSummaryDto {
    refreshed_at: string;
    total_count: number;
    recent_demandas: PublicDemandaItemDto[];
    filters: PublicFiltersDto;
}

export class PublicDemandaFullDto {
    refreshed_at: string;
    total_count: number;
    demandas: PublicDemandaItemDto[];
    filters: PublicFiltersDto;
}

export class PublicArquivoDto {
    id: number;
    descricao: string | null;
    arquivo: any;
}

export class PublicDemandaDetailItemDto extends PublicDemandaItemDto {
    acoes: { id: number; nome: string }[];
    arquivos: PublicArquivoDto[];
}

export class PublicDemandaDetailDto {
    refreshed_at: string;
    demanda: PublicDemandaDetailItemDto;
}

export class PublicGeocamadasDto {
    refreshed_at: string;
    data: any[];
}

export class PublicCacheDeletedDto {
    deleted: boolean;
}
