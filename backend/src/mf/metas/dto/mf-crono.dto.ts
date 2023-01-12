import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly";
import { IdCodTituloRespDto } from "./mf-meta.dto";

export class MfEtapaDto {

    /**
    * inicio_real
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_real?: Date

    /**
    * termino_real
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    termino_real?: Date

}


export class AtividadesCronoRetorno {
    atividade: IdCodTituloRespDto
    cronogramas: number[]
}
export class IniciativasCronoRetorno {
    iniciativa: IdCodTituloRespDto
    atividades: AtividadesCronoRetorno[]
    cronogramas: number[]
}

export class RetornoMetaCronogramaDto {
    meta: {
        iniciativas: IniciativasCronoRetorno[]
        cronogramas: number[]
        codigo: string
        titulo: string
        id: number
        orgaos_responsaveis: string[]
        orgaos_participantes: string[]
        responsaveis_na_cp: string[]
    } | null
}
