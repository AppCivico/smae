import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../../auth/transforms/number-array.transform';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export class FiltroMetasIniAtividadeDto {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    pdm_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    meta_id?: number;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @Transform(NumberArrayTransformOrUndef)
    @Expose()
    metas_ids?: number[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @Transform(NumberArrayTransformOrUndef)
    @ApiProperty({ deprecated: true, description: 'Use metas_ids instead' })
    metas?: number[];

    @IsOptional()
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    iniciativa_id?: number;

    /**
     * @example ""
     */
    @IsOptional()
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    atividade_id?: number;

    /**
     * filtrar apenas indicadores/iniciativas/atividades com as tags, se vazio=não filtra por nada
     * @example "[]"
     */
    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Expose()
    tags?: number[];

    @IsOptional()
    @IsEnum(TipoPdm)
    @ApiHideProperty()
    @Expose()
    tipo_pdm?: TipoPdm;
}
