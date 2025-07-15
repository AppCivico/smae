import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export class CreateRelParlamentaresDto {
    @IsOptional()
    @IsNumber()
    @Transform(NumberTransformOrUndef)
    @Expose()
    partido_id?: number;

    @IsOptional()
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo)
    @Expose()
    cargo?: ParlamentarCargo;

    @IsOptional()
    @IsNumber()
    @Transform(NumberTransformOrUndef)
    @Expose()
    eleicao_id?: number;
}
