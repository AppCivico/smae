import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumberString, IsOptional, IsString, Max, Min, ValidateIf } from "class-validator";
import { IsOnlyDate } from "../../common/decorators/IsDateOnly";

export class CreateVariavelDto {

    /**
    * ID do indicador (é required para criar já o relacionamento)
    */
    @IsInt({ message: '$property| indicador precisa existir' })
    @Type(() => Number)
    indicador_id?: number // manter undefined pq precisamos apagar antes do insert

    /**
    * lista dos responsáveis pelo preenchimento? pelo menos uma pessoa
    * @example "[4, 5, 6]"
    */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(1, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    responsaveis?: number[] // manter undefined pq precisamos apagar antes do insert

    /**
    * ID do órgão
    */
    @IsInt({ message: '$property| órgão responsável' })
    @Type(() => Number)
    orgao_id: number

    /**
    * ID da região (opcional)
    */
    @IsOptional()
    @IsInt({ message: '$property| região é opcional via (null) ou precisa ser um numérico' })
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

    @IsInt({ message: "$property| $property inválido" })
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

    @IsInt({ message: '$property| unidade de medida precisa ser numérico' })
    @Type(() => Number)
    unidade_medida_id: number


    @IsBoolean({ message: 'acumulativa| Precisa ser um boolean' })
    acumulativa: boolean

    @IsOptional()
    @IsInt({ message: '$property| ano_base precisa ser numérico' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    ano_base?: number | null

    @IsString()
    codigo: string


    /**
    * inicio_medicao [obrigatório apenas caso a periodicidade for diferente do indicador, se for igual, será transformado em null]
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_medicao: Date | null

    /**
     * fim_medicao [obrigatório apenas caso a periodicidade for diferente do indicador, se for igual, será transformado em null]
     * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    fim_medicao: Date | null

    @IsOptional()
    @IsInt({ message: '$property| atraso_meses precisa ser numérico' })
    @Type(() => Number)
    @Min(0)
    atraso_meses?: number

}
