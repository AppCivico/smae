import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional } from 'class-validator';
import { NumberArrayTransform } from '../../../auth/transforms/number-array.error';

export class FiltroMetasIniAtividadeDto {
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
    @Transform(NumberArrayTransform)
    meta_ids?: number[];

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
}
