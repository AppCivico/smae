import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateRelParlamentaresDto {
    @IsOptional()
    @IsNumber()
    @Transform(({ value }: any) => +value)
    partido_id?: number;

    @IsOptional()
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo)
    cargo?: ParlamentarCargo;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }: any) => +value)
    eleicao_id?: number;
}
