import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNumber, IsNumberString, IsOptional, IsPositive, IsString, Max, Min, ValidateIf } from "class-validator";

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

    /**
    * valor_base para ser usado em gráficos
    * Para não perder precisão no JSON, usar em formato string, mesmo sendo um número
    * @example "0.0"
    */
    @IsNumberString({ maxDecimalPlaces: 30 }, { message: "Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String" })
    valor_base: number

    @IsNumber(undefined, { message: "$property| $property inválido" })
    @Min(0, { message: '$property| casas_decimais tem valor mínimo de zero' })
    @Max(30, { message: '$property| casas_decimais tem valor máximo de 30' })
    @Transform((a: any) => a.value === '' ? undefined : +a.value)
    casas_decimais: number

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
    @IsPositive({ message: '$property| peso precisa ser numérico e positivo' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    peso?: number


    @IsBoolean({ message: 'acumulativa| Precisa ser um boolean' })
    acumulativa: boolean

    @IsOptional()
    @IsPositive({ message: '$property| ano_base precisa ser numérico' })
    @Type(() => Number)
    ano_base?: number

    @IsString()
    codigo: string
}
