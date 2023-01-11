import { ApiProperty } from "@nestjs/swagger"
import { Serie } from "@prisma/client"
import { IdCodTituloDto } from "src/common/dto/IdCodTitulo.dto"
import { Regiao } from "src/regiao/entities/regiao.entity"

export class RelIndicadoresDto {
    indicador: IdCodTituloDto
    meta: IdCodTituloDto | null
    iniciativa: IdCodTituloDto | null
    atividade: IdCodTituloDto | null
    tag: RelTag | null

    @ApiProperty({ enum: Serie, enumName: 'Serie' })
    serie: string
    /**
     * data em YYYY-MM (anual, analítico), YYYY (anual, consolidado) ou "YYYY-MM/YYYY-MM" (semestral, consolidado e analítico)
     **/
    data: string
    /**
     * Valor inteiro ou null
     **/
    valor: string | null
}

export class RelIndicadoresVariaveisDto extends RelIndicadoresDto {
    variavel?: IdCodTituloDto
    regiao?: Regiao
}

export class ListIndicadoresDto {
    linhas: RelIndicadoresDto[]
    regioes: RelIndicadoresVariaveisDto[]
}

export class RelTag {
    id: number
    descricao: string
}