import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { GeoReferenciaTipo } from 'src/generated/prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { GeoJSON } from 'geojson';
import { IsGeoJSON } from '../../auth/decorators/is-geojson.decorator';
import { NumberArrayTransformOrUndef } from '../../auth/transforms/number-array.transform';
import { NumberTransform, PositiveNumberTransform } from '../../auth/transforms/number.transform';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class GeoLocDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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

export class IdRegiaoNivel {
    id: number;
    descricao: string;
    nivel_regionalizacao: number;
}

export class GeoLocCamadaFullDto extends GeoLocCamadaSimplesDto {
    geom_geojson: GeoJSON;
    regiao: IdRegiaoNivel[] | undefined;
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
    @Transform(({ value }: any) => value === 'true')
    @IsBoolean()
    retornar_regioes?: boolean;

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
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Tipo camada' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    tipo_camada: string;
}
