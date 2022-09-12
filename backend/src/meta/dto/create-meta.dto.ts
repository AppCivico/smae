import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator";


export class MetaOrgaoParticipante {
    /**
    * orgão participante é responsável?
    * @example "false"
    */
    @IsBoolean({ message: 'Campo responsavel precisa ser do tipo Boolean' })
    responsavel: boolean

    /**
    * órgão
    * @example 1
    */
    @IsPositive({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id: number;

    /**
    * lista dos participantes?
    */
    participantes: number[]

}

export class CreateMetaDto {

    /**
    * Código
    */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(30, { message: '$property| descrição: codigo 30 caracteres' })
    codigo: string

    /**
    * título
    */
    @IsString({ message: '$property| título: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| título: codigo 250 caracteres' })
    titulo: string


    /**
    * contexto
    */
    @IsOptional()
    @IsString({ message: '$property| título: Precisa ser alfanumérico' })
    @MaxLength(1000, { message: '$property| título: codigo 1000 caracteres' })
    contexto?: string

    /**
    * complemento
    */
    @IsOptional()
    @IsString({ message: '$property| título: Precisa ser alfanumérico' })
    @MaxLength(1000, { message: '$property| título: codigo 1000 caracteres' })
    complemento?: string

    /**
    * macro_tema_id
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    macro_tema_id?: number

    /**
    * tema_id
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    tema_id?: number

    /**
    * sub_tema_id
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    sub_tema_id?: number


    /**
   * pdm_id
   */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    pdm_id: number


    /**
    * orgaos_participantes
    */
    orgaos_participantes: MetaOrgaoParticipante[]

    /**
    * meta_participantes
    */
    coordenadores_cp: number[]
}
