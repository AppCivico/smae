import { ApiProperty } from "@nestjs/swagger"
import { Serie } from "@prisma/client"
import { IdCodTituloDto } from "src/common/dto/IdCodTitulo.dto"
import { Regiao } from "src/regiao/entities/regiao.entity"

export class RelPaineisDto {
    meta: IdCodTituloDto

    /**
     * data em YYYY-MM (mês e ano)
     **/
    data: string
    /**
     * Valor inteiro ou null
     **/
    valor: number | null
}


export class ListRelPaineisDto {
    linhas: RelPaineisDto[]
}
