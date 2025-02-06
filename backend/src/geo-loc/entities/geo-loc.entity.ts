import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GeoReferenciaTipo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { GeoJSON } from 'geojson';
import { IsGeoJSON } from '../../auth/decorators/is-geojson.decorator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';
import { NumberTransform, PositiveNumberTransform } from '../../auth/transforms/number.transform';

export class GeoLocDto {
    @IsString()
    @MaxLength(100)
    busca_endereco: string;

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    @IsEnum(GeoReferenciaTipo)
    tipo: string;
}

export class GeoLocDtoByLatLong {
    @IsNumber()
    @Transform(NumberTransform)
    lat: number;

    @IsNumber()
    @Transform(NumberTransform)
    long: number;

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    @IsEnum(GeoReferenciaTipo)
    tipo: string;
}

export class GeoLocCamadaSimplesDto {
    id: number;
    titulo: string;
    codigo: string;
    descricao: string;
    nivel_regionalizacao: number | null;
    cor: string | null;
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
    @Transform(NumberArrayTransformOrUndef)
    camada_ids?: number[];

    @IsOptional()
    @IsInt()
    @Transform(PositiveNumberTransform)
    camada_nivel_regionalizacao?: number;

    @IsOptional()
    @IsInt()
    @Transform(PositiveNumberTransform)
    regiao_nivel_regionalizacao?: number;

    @IsOptional()
    @IsInt()
    @Transform(PositiveNumberTransform)
    @ApiProperty({
        description:
            'Filtra Apenas camadas que estão associadas com regiões do SMAE, onde as regiões do SMAE são filhas diretas ou indiretas desta',
    })
    filha_de_regiao_id?: number;
}

export class CreateEnderecoDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
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

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    tipo: GeoReferenciaTipo;

    @ApiProperty({ description: 'GeoJson', example: '{}' })
    endereco: GeoJSON;

    camadas: GeoLocCamadaSimplesDto[];
}

export class GeolocalizacaoDto extends RetornoCreateEnderecoDto {}

export class ReferenciasValidasBase {
    private static props: (keyof ReferenciasValidasBase)[] = [
        'projeto_id',
        'iniciativa_id',
        'atividade_id',
        'meta_id',
        'etapa_id',
    ];

    projeto_id?: number | number[];
    iniciativa_id?: number | number[];
    atividade_id?: number | number[];
    meta_id?: number | number[];
    etapa_id?: number | number[];

    validaReferencia(): void {
        const countTruthy = ReferenciasValidasBase.props.filter((prop) => !!this[prop]).length;

        if (countTruthy !== 1) {
            throw new BadRequestException('Necessário informar exatamente uma associação!');
        }
    }

    referencia(): 'projeto_id' | 'iniciativa_id' | 'atividade_id' | 'meta_id' | 'etapa_id' {
        const definedKeys = ReferenciasValidasBase.props.find((key) => this[key] !== undefined);

        if (!definedKeys) {
            throw new BadRequestException('Necessário informar exatamente uma associação!');
        }

        return definedKeys as any;
    }
}

export class CreateGeoEnderecoReferenciaDto extends ReferenciasValidasBase {
    tokens: string[] | undefined;

    @ApiProperty({ enum: GeoReferenciaTipo, enumName: 'GeoReferenciaTipo' })
    @IsEnum(GeoReferenciaTipo)
    tipo: GeoReferenciaTipo;
}

export class FindGeoEnderecoReferenciaDto extends ReferenciasValidasBase {}

export class FilterGeoJsonDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    regiao_ids?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    nivel?: number[];

    @IsString()
    @MaxLength(100)
    tipo_camada: string;
}
