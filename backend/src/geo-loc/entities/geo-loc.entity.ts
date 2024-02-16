import { ApiProperty } from '@nestjs/swagger';
import { GeoReferenciaTipo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { GeoJSON } from 'geojson';
import { NumberArrayTransform } from '../../auth/transforms/number-array.error';
import { IsGeoJSON } from '../../auth/decorators/is-geojson.decorator';

export class GeoLocDto {
    @IsString()
    @MaxLength(100)
    busca_endereco: string;

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    @IsEnum(GeoReferenciaTipo)
    tipo: string;
}

export class GeoLocCamadaSimplesDto {
    id: number;
    titulo: string;
    codigo: string;
    descricao: string;
}

export class GeoLocCamadaFullDto extends GeoLocCamadaSimplesDto {
    geom_geojson: GeoJSON;
}

export class RetornoGeoLocCamadaFullDto {
    linhas: GeoLocCamadaFullDto[];
}

export class GeoLocListRetDto {
    endereco: GeoJSON;
    camadas: GeoLocCamadaSimplesDto[];
}

export class RetornoGeoLoc {
    linhas: GeoLocListRetDto[];
}

export class FilterCamadasDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransform)
    camada_ids?: number[];
}

export class CreateEnderecoDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransform)
    camadas: number[];

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    @IsEnum(GeoReferenciaTipo)
    tipo: GeoReferenciaTipo;

    @IsGeoJSON()
    endereco: GeoJSON;
}

export class RetornoCreateEnderecoDto {
    token: string;
    endereco_exibicao: string | undefined;
}

export class CreateGeoEnderecoReferenciaDto {
    token: string;

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    @IsEnum(GeoReferenciaTipo)
    tipo: GeoReferenciaTipo;

    projeto_id?: number;
    iniciativa_id?: number;
    atividade_id?: number;
    meta_id?: number;
    etapa_id?: number;
}
