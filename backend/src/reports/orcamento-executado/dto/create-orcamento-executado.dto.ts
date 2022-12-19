import { IntersectionType } from "@nestjs/swagger"
import { TipoRelatorio } from "@prisma/client"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"
import { FiltroMetasIniAtividadeDto } from "../../reports/dto/filtros.dto"

export class OrcamentoExecutadoParams {
    pdm_id: number

    tipo: TipoRelatorio

    @IsOnlyDate()
    inicio: Date

    @IsOnlyDate()
    fim: Date
}

export class CreateOrcamentoExecutadoDto extends IntersectionType(
    FiltroMetasIniAtividadeDto,
    OrcamentoExecutadoParams
) { }
