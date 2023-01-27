import { ApiProperty } from "@nestjs/swagger";
import { ProjetoStatus } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, isNumber, IsOptional } from "class-validator";

export class FilterProjetoDto {
    @IsOptional()
    @IsBoolean()
    prioritario?: boolean

    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', ')
    })
    status?: ProjetoStatus

    @IsOptional()
    @IsNumber()
    orgao?: number
}