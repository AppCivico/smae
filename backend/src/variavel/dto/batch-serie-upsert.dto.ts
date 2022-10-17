import { Serie } from "@prisma/client"
import { IsArray, isArray, IsNumberString, IsString, ValidateIf } from "class-validator"

export class ExistingSerieJwt {
    id: number
    v: number // variable_id
}

export class NonExistingSerieJwt {
    p: string // variable_id
    v: number // variable_id
    s: Serie
}

export type SerieJwt = ExistingSerieJwt | NonExistingSerieJwt

export class ValidatedUpsert {
    valor: string

    /**
     * referencia do valor pra ser criado/atualizado
     * @example "token.nao-tao-grande.assim"
     * */
    @IsString()
    referencia: SerieJwt
}

export class SerieUpsert {
    /**
     * valor pra ser salvo
     * @example "vazio or ou decimal como string '3.141567'"
     * */
    @IsNumberString({ maxDecimalPlaces: 30 }, { message: "Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou nulo" })
    @ValidateIf((object, value) => value !== '')
    valor: string

    /**
     * referencia do valor pra ser criado/atualizado
     * @example "token.nao-tao-grande.assim"
     * */
    @IsString()
    referencia: string
}

export class BatchSerieUpsert {
    @IsArray({ message: 'Precisa ser um array'})
    valores: SerieUpsert[]
}