import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeoReferenciaTipo, ProjetoStatus, TipoProjeto } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { GeoJSON } from 'geojson';

export class GeoInfoBaseDto {
    @ApiProperty()
    geo_localizacao_id: number;

    @ApiProperty()
    endereco_exibicao: string;

    @ApiProperty()
    lat: number;

    @ApiProperty()
    lon: number;

    @ApiProperty({ enum: GeoReferenciaTipo })
    tipo_referencia: GeoReferenciaTipo;

    @ApiProperty({ type: 'object', description: 'GeoJSON original da localização' })
    geom_geojson: GeoJSON;

    @ApiPropertyOptional({ description: 'Distância em metros até o ponto de busca (apenas se busca por lat/lon)' })
    distancia_metros?: number;
}

export class ProjetoSearchResultDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nome: string;

    @ApiPropertyOptional()
    codigo?: string | null;

    @ApiPropertyOptional()
    portfolio_id?: number;

    @ApiPropertyOptional()
    portfolio_titulo?: string | null;

    @ApiProperty({ enum: TipoProjeto })
    tipo: TipoProjeto;

    @ApiProperty({ enum: ProjetoStatus })
    status: ProjetoStatus;

    @ApiPropertyOptional()
    grupo_tematico_id?: number | null;
    @ApiPropertyOptional()
    grupo_tematico_nome?: string | null;

    @ApiPropertyOptional()
    tipo_intervencao_id?: number | null;
    @ApiPropertyOptional()
    tipo_intervencao_nome?: string | null;

    @ApiPropertyOptional()
    equipamento_id?: number | null;
    @ApiPropertyOptional()
    equipamento_nome?: string | null;

    @ApiPropertyOptional()
    empreendimento_id?: number | null;
    @ApiPropertyOptional()
    empreendimento_nome?: string | null;
    @ApiPropertyOptional()
    empreendimento_identificador?: string | null;

    @ApiPropertyOptional({ description: 'Subprefeituras (nomes das regiões)' })
    subprefeitura_nomes?: string;

    @ApiPropertyOptional()
    orgao_responsavel_id?: number | null;
    @ApiPropertyOptional()
    orgao_responsavel_sigla?: string | null;
    @ApiPropertyOptional()
    orgao_responsavel_descricao?: string | null;

    @ApiProperty({ type: () => [GeoInfoBaseDto] })
    localizacoes: GeoInfoBaseDto[];
}

export class MetaSearchResultDto {
    @ApiProperty()
    id: number;

    @ApiProperty({ type: () => [GeoInfoBaseDto] })
    localizacoes: GeoInfoBaseDto[];
}

export class IniciativaSearchResultDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    codigo: string;

    @ApiProperty()
    titulo: string;

    @ApiProperty()
    meta_id: number;

    @ApiProperty()
    pdm_id: number;

    @ApiPropertyOptional({ description: 'Siglas dos órgãos da iniciativa', type: [String] })
    orgaos_sigla?: string[];

    @ApiProperty({ type: () => [GeoInfoBaseDto] })
    localizacoes: GeoInfoBaseDto[];
}

export class AtividadeSearchResultDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    codigo: string;

    @ApiProperty()
    titulo: string;

    @ApiProperty()
    iniciativa_id: number;

    @ApiProperty()
    iniciativa_titulo: string;

    @ApiProperty()
    meta_id: number;

    @ApiProperty()
    pdm_id: number;

    @ApiPropertyOptional({ description: 'Siglas dos órgãos da atividade', type: [String] })
    orgaos_sigla?: string[];

    @ApiProperty({ type: () => [GeoInfoBaseDto] })
    localizacoes: GeoInfoBaseDto[];
}

export class EtapaSearchResultDto {
    @ApiProperty()
    id: number;

    @ApiPropertyOptional()
    titulo?: string;

    @ApiProperty()
    cronograma_id: number;

    @ApiProperty()
    meta_id: number;

    @ApiProperty({ type: () => [GeoInfoBaseDto] })
    localizacoes: GeoInfoBaseDto[];
}

export class PdmRotuloInfo {
    id: number;
    rotulo_atividade: string;
    rotulo_iniciativa: string;
    rotulo_macro_tema: string;
}

export class MetaLookupInfoDto {
    id: number;
    codigo: string;
    titulo: string;
    pdm_id: number;
    macro_tema_id: number | null;
    macro_tema_nome: string | null;
    @ApiPropertyOptional({ description: 'Siglas dos órgãos da meta', type: [String] })
    orgaos_sigla?: string[];
}

export class SearchEntitiesNearbyDto {
    @ApiPropertyOptional({ description: 'Latitude para busca por ponto' })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat?: number;

    @ApiPropertyOptional({ description: 'Longitude para busca por ponto' })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    lon?: number;

    @ApiPropertyOptional({
        description:
            'Raio de busca em quilômetros. Padrão 2km se lat/lon ou busca_endereco for fornecido para tipo "Endereco". Não utilizado para busca por distrito.',
        default: 2,
    })
    @IsOptional()
    @IsNumber()
    @Min(0.1)
    @Max(10)
    raio_km?: number = 2;

    @ApiPropertyOptional({ description: 'ID da configuração da GeoCamada que representa distritos/subprefeituras' })
    @IsOptional()
    @IsNumber()
    geo_camada_config_id?: number;

    @ApiPropertyOptional({ description: 'Código da GeoCamada do distrito/subprefeitura (ex: "SE" para Sé)' })
    @IsOptional()
    @IsString()
    geo_camada_codigo?: string;

    @ApiPropertyOptional({ description: 'ID da Região para busca' })
    @IsOptional()
    @IsNumber()
    regiao_id?: number;
}

export class SearchEntitiesNearbyResponseDto {
    @ApiProperty({ type: [ProjetoSearchResultDto] })
    projetos: ProjetoSearchResultDto[];

    @ApiProperty({ type: [ProjetoSearchResultDto], description: 'Obras são Projetos do tipo MDO' })
    obras: ProjetoSearchResultDto[];

    @ApiProperty({ type: [MetaSearchResultDto] })
    metas: MetaSearchResultDto[];

    @ApiProperty({ type: [IniciativaSearchResultDto] })
    iniciativas: IniciativaSearchResultDto[];

    @ApiProperty({ type: [AtividadeSearchResultDto] })
    atividades: AtividadeSearchResultDto[];

    @ApiProperty({ type: [EtapaSearchResultDto] })
    etapas: EtapaSearchResultDto[];

    @ApiProperty({ type: [PdmRotuloInfo], description: 'Informações de rótulos para PDMs relevantes.' })
    pdm_info: PdmRotuloInfo[];

    @ApiProperty({
        type: [MetaLookupInfoDto],
        description:
            'Informações de lookup para Metas referenciadas por iniciativas, atividades ou etapas encontradas.',
    })
    metas_info: MetaLookupInfoDto[];
}
