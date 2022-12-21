import { ApiProperty, refs } from "@nestjs/swagger"
import { FonteRelatorio } from "@prisma/client"
import { IsBoolean, IsEnum, IsOptional } from "class-validator"
import { CreateIndicadorDto } from "src/reports/indicadores/dto/create-indicadore.dto"
import { CreateOrcamentoExecutadoDto } from "../../orcamento/dto/create-orcamento-executado.dto"
import { ReportValidatorOf } from "../report-validator-of"

export class CreateReportDto {
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', ')
    })
    fonte: FonteRelatorio

    /**
     * Parâmetros para o relatório escolhido
     *
     * @example "{}"
    */
    @ReportValidatorOf('fonte')
    @ApiProperty({oneOf: refs(CreateOrcamentoExecutadoDto, CreateIndicadorDto)})
    parametros: any

    @IsOptional()
    @IsBoolean()
    salvar_arquivo?: boolean
}