import { ApiProperty, IntersectionType } from "@nestjs/swagger"
import { TipoRelatorio } from "@prisma/client"
import { IsEnum, IsInt, IsNumber, IsOptional } from "class-validator"
import { FiltroMetasIniAtividadeDto } from "../../relatorios/dto/filtros.dto"

export class PaineisParams {
    /**
     * @example "Analitico"
    */
    @ApiProperty({ enum: TipoRelatorio, enumName: 'TipoRelatorio' })
    @IsEnum(TipoRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorio).join(', ')
    })
    tipo: TipoRelatorio

    @IsInt()
    ano: number
    
    @IsInt()
    mes: number
}

export class CreateRelPaineisDto extends IntersectionType(
    FiltroMetasIniAtividadeDto,
    PaineisParams
) { }
