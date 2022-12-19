import { ApiProperty, IntersectionType } from "@nestjs/swagger"
import { TipoRelatorio } from "@prisma/client"
import { Type } from "class-transformer"
import { IsEnum } from "class-validator"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"
import { FiltroMetasIniAtividadeDto } from "../../reports/dto/filtros.dto"

export class OrcamentoExecutadoParams {
    pdm_id: number


    @ApiProperty({ enum: TipoRelatorio, enumName: 'TipoRelatorio' })
    @IsEnum(TipoRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorio).join(', ')
    })
    tipo: TipoRelatorio

    @IsOnlyDate()
    @Type(() => Date)
    inicio: Date

    @IsOnlyDate()
    @Type(() => Date)
    fim: Date
}

export class CreateOrcamentoExecutadoDto extends IntersectionType(
    FiltroMetasIniAtividadeDto,
    OrcamentoExecutadoParams
) { }
