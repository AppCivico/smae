import { ApiProperty } from "@nestjs/swagger";
import { ParlamentarCargo } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional } from "class-validator";

export class FilterParlamentarDto {
    @IsOptional()
    @IsNumber()
    partido_id?: number;

    @IsOptional()
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarCargo).join(', '),
    })
    cargo?: ParlamentarCargo;

    @IsOptional()
    @IsNumber()
    disponivel_para_suplente_parlamentar_id?: number;
}