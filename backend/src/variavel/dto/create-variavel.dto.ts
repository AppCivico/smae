import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade } from "@prisma/client";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNumberString, IsOptional, IsPositive, IsString, ValidateIf } from "class-validator";

export class CreateVariavelDto {

    /**
    * ID do indicador (é required para criar já o relacionamento)
    */
    @IsPositive({ message: '$property| indicador precisa existir' })
    @Type(() => Number)
    indicador_id?: number

    /**
    * lista dos responsáveis pelo preenchimento? pelo menos uma pessoa
    * @example "[4, 5, 6]"
    */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(1, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    responsaveis?: number[]

    /**
    * ID do órgão
    */
    @IsPositive({ message: '$property| órgão responsável' })
    @Type(() => Number)
    orgao_id: number

    /**
    * ID da região (opcional)
    */
    @IsOptional()
    @IsPositive({ message: '$property| região é opcional via (null) ou precisa ser um numérico' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    regiao_id?: number

    @IsString()
    titulo: string

    @IsNumberString({ maxDecimalPlaces: 30 })
    valor_base: number

    /**
     * Periodicidade da variável
     * @example "Bimestral"
    */
    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', ')
    })
    periodicidade: Periodicidade

    @IsPositive({ message: '$property| unidade de medida precisa ser numérico' })
    @Type(() => Number)
    unidade_medida_id: number


    /**
     * usado para calcular as agregações, por exemplo na média ponderada
    */
    @IsOptional()
    @IsPositive({ message: '$property| peso precisa ser numérico' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    peso?: number


    @IsBoolean()
    acumulativa: boolean
}
