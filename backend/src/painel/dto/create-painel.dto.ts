import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade } from "@prisma/client";
import { IsBoolean, IsEnum, IsString } from "class-validator";

export class CreatePainelDto {
    @IsString()
    nome: string

    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', ')
    })
    periodicidade: Periodicidade

    @IsBoolean()
    mostrar_planejado_por_padrao: boolean

    @IsBoolean()
    mostrar_acumulado_por_padrao: boolean

    @IsBoolean()
    mostrar_indicador_por_padrao: boolean

    @IsBoolean()
    ativo: boolean
}