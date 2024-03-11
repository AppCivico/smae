import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { PositiveNumberTransform } from 'src/auth/transforms/number.transform';

export class CreateRelParlamentaresDto {
    @IsOptional()
    @IsNumber()
    @Transform(PositiveNumberTransform)
    partido_id?: number;

    @IsOptional()
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo)
    cargo?: ParlamentarCargo;

    @IsOptional()
    @IsNumber()
    @Transform(PositiveNumberTransform)
    eleicao_id?: number;
}
