import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../../auth/transforms/number-array.transform';
import { TipoPdm } from '@prisma/client';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class FiltroMetasIniAtividadeDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    pdm_id?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    meta_id?: number;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @Transform(NumberArrayTransformOrUndef)
    metas_ids?: number[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @Transform(NumberArrayTransformOrUndef)
    @ApiProperty({ deprecated: true, description: 'Use metas_ids instead' })
    metas?: number[];

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * @example ""
     */
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
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
    tags?: number[];

    @IsOptional()
    @IsEnum(TipoPdm)
    @ApiHideProperty()
    tipo_pdm?: TipoPdm;
}
