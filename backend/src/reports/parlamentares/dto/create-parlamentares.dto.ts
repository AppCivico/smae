import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateRelParlamentaresDto {
    @IsOptional()
    @IsNumber()
    partido_id?: number;

    @IsOptional()
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo)
    cargo?: ParlamentarCargo;

    @IsOptional()
    @IsNumber()
    eleicao_id?: number;
}
