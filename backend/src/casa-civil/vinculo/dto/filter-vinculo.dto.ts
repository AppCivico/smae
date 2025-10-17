import { ApiProperty } from '@nestjs/swagger';
import { CampoVinculo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';
import { NumberTransformOrUndef } from 'src/auth/transforms/number.transform';

export class FilterVinculoDto {
    @IsNumber()
    @IsOptional()
    @Transform(NumberTransformOrUndef)
    meta_id?: number;

    @IsInt()
    @IsOptional()
    @Transform(NumberTransformOrUndef)
    projeto_id?: number;

    @IsInt()
    @IsOptional()
    @Transform(NumberTransformOrUndef)
    transferencia_id?: number;

    @IsInt()
    @IsOptional()
    @Transform(NumberTransformOrUndef)
    distribuicao_id?: number;

    @IsInt()
    @Transform(NumberTransformOrUndef)
    @IsOptional()
    tipo_vinculo_id?: number;

    @IsOptional()
    @ApiProperty({ enum: CampoVinculo, enumName: 'CampoVinculo' })
    @IsEnum(CampoVinculo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(CampoVinculo).join(', '),
    })
    campo_vinculo?: CampoVinculo;
}
