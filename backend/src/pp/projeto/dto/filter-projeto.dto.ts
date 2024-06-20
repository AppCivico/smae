import { ApiProperty } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { NumberArrayTransformOrEmpty } from '../../../auth/transforms/number-array.transform';
import { StringArrayTransform } from '../../../auth/transforms/string-array.transform';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class FilterProjetoDto {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    eh_prioritario?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    arquivado?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        return value.split(',');
    })
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsArray({ message: '$property| precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
        each: true,
    })
    status?: ProjetoStatus[];

    /**
     * órgão responsável
     **/
    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    orgao_responsavel_id?: number;

    /**
     * portfolio_id
     **/
    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    portfolio_id?: number;
}

export class FilterProjetoMDODto extends FilterProjetoDto {
    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    orgao_origem_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    regioes?: number[];

    @IsOptional()
    @IsString({ each: true })
    @Transform(StringArrayTransform)
    nome?: string[];

    @IsOptional()
    @IsString({ each: true })
    @Transform(StringArrayTransform)
    codigo?: string[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    grupo_tematico_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    tipo_intervencao_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    equipamento_id?: number[];

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    ipp?: number = 25;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    pagina?: number = 1;

    @IsOptional()
    @IsString()
    token_paginacao?: string;
}
