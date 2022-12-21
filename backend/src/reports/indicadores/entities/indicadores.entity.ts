import { ApiProperty } from "@nestjs/swagger"
import { Serie } from "@prisma/client"
import { IdCodTituloDto } from "src/common/dto/IdCodTitulo.dto"
import { Regiao } from "src/regiao/entities/regiao.entity"

export class RelIndicadoresDto {
    meta: IdCodTituloDto
    iniciativa: IdCodTituloDto | null
    atividade: IdCodTituloDto | null

    @ApiProperty({ enum: Serie, enumName: 'Serie' })
    serie: Serie
    /**
     * data em YYYY-MM (anual, analítico), YYYY (anual, consolidado) ou "YYYY-MM/YYYY-MM" (semestral, consolidado e analítico)
     **/
    data: string
    /**
     * Valor inteiro ou null
     **/
    valor: number | null
}

export class IndRelRegioes {
    linhas: RelIndicadoresDto[]
    regiao: Regiao
}

export class ListIndicadoresDto {
    linhas: RelIndicadoresDto[]
    regioes: IndRelRegioes[]
}
