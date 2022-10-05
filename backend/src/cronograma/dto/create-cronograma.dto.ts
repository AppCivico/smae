import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsOptional, IsPositive, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

// export class MetaOrgaoParticipante {
//     /**
//     * orgão participante é responsável? Pelo menos um precisa ser responsável
//     * @example false
//     */
//     @IsBoolean({ message: 'Campo responsavel precisa ser do tipo Boolean' })
//     responsavel: boolean

//     /**
//     * órgão
//     * @example 1
//     */
//     @IsPositive({ message: '$property| orgao_id' })
//     @Type(() => Number)
//     orgao_id: number;

//     /**
//     * lista dos participantes? pelo menos uma pessoa
//     * @example "[4, 5, 6]"
//     */
//     @IsArray({ message: '$property| precisa ser um array' })
//     @ArrayMinSize(1, { message: '$property| precisa ter um item' })
//     @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
//     participantes: number[]

// }

export class CreateCronogramaDto {
    /**
    * meta_id
    */
    @IsPositive({ message: '$property| meta precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    meta_id?: number

    /**
    * iniciativa_id
    */
    @IsPositive({ message: '$property| iniciativa precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    iniciativa_id?: number

    /**
    * atividade_id
    */
    @IsPositive({ message: '$property| atividade precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    atividade_id?: number

    /**
    * descricao
    */
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @IsOptional()
    descricao?: string

    /**
    * observacao
    */
    @IsString({ message: '$property| observacao: Precisa ser alfanumérico' })
    @IsOptional()
    observacao?: string

    @IsBoolean({ message: '$property| precisa ser um boolean' })
    por_regiao: boolean

    @IsString({ message: '$property| tipo_regiao: Precisa ser alfanumérico' })
    tipo_regiao?: string


}