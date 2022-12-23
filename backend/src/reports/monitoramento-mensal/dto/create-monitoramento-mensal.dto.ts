import { IntersectionType, OmitType } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional } from "class-validator"
import { FiltroMetasIniAtividadeDto } from "../../relatorios/dto/filtros.dto"

export class RelMonitoramentoMensalParams {
    /** ano do ciclo
     * @example ""
    */
    @IsOptional()
    @Type(() => Number)
    ano: number

    /** mes do ciclo
    * @example ""
   */
    @IsNumber()
    @Type(() => Number)
    mes: number

    /**
     * quais paineis puxar os relatorios
     * @example "[]"
    */
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(1, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    paineis: number[]
}

// excluindo o atividade/iniciativa pq sempre busca pela meta aqui
// logo n faz sentido ir buscar
export class CreateRelMonitoramentsoMensalDto extends IntersectionType(
    OmitType(FiltroMetasIniAtividadeDto, ['atividade_id', 'iniciativa_id'] as const),
    RelMonitoramentoMensalParams
) { }
