import { IntersectionType, OmitType } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNumber, IsOptional } from "class-validator"
import { FiltroMetasIniAtividadeDto } from "../../relatorios/dto/filtros.dto"

export class RelMonitoramentoMensalParams {
    /** ano do ciclo
     * @example ""
    */
    @IsOptional()
    @Type(() => Number)
    ano?: number

    /** mes do ciclo
    * @example ""
   */
    @IsNumber()
    @Type(() => Number)
    mes?: number
}

// excluindo o atividade/iniciativa pq sempre busca pela meta aqui
// logo n faz sentido ir buscar
export class CreateRelMonitoramentsoMensalDto extends IntersectionType(
    OmitType(FiltroMetasIniAtividadeDto, ['atividade_id', 'iniciativa_id'] as const),
    RelMonitoramentoMensalParams
) { }
