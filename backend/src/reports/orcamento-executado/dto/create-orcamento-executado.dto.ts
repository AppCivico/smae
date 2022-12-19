import { ApiProperty, IntersectionType, OmitType, PickType } from "@nestjs/swagger"
import { TipoRelatorio } from "@prisma/client"
import { Type } from "class-transformer"
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from "class-validator"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"
import { FiltroMetasIniAtividadeDto } from "../../reports/dto/filtros.dto"

export class OrcamentoExecutadoParams {
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

    /**
     * filtrar apenas os órgão (SOF) que estão nessa lista
    */
    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsString({ each: true, message: '$property| Cada item precisa ser um texto' })
    @MaxLength(40, { each: true })
    orgaos?: string[]
}

// excluindo o atividade/iniciativa pq nunca tem resultados pra orçamento
// logo n faz sentido ir buscar
export class CreateOrcamentoExecutadoDto extends IntersectionType(
    OmitType(FiltroMetasIniAtividadeDto, ['atividade_id', 'iniciativa_id'] as const),
    OrcamentoExecutadoParams
) { }
