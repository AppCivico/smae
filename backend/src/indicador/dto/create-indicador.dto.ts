import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade, Polaridade } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";


export class FormulaVariaveis {

    /**
     * referência da variavel, único por indicador - de 1 até 5 chars [A-Z] em upper-case
    */
    @IsString({ message: '$property| precisa ser uma string' })
    @Matches(/^[A-Z]{1,5}$/, { message: '$property| Inválido, use apenas A-Z de 1 até 5 chars' })
    referencia: string

    /**
    * janela - 1 para periodo corrente, > 1 para buscar o mês retroativo, < 0 para fazer média dos valores
    * 0 será convertido para 1 automaticamente
    */
    @IsNumber(undefined, { message: '$property| descrição: Precisa ser um número' })
    @Transform((a: any) => +a.value)
    janela: number

    /**
     * ID da variavel
    */
    @IsPositive({ message: '$property| precisa ser um número' })
    variavel_id: number

    /**
     * Usar serie acumulada
    */
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    usar_serie_acumulada: boolean
}

export class CreateIndicadorDto {

    /**
    * Código
    */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(30, { message: '$property| código 30 caracteres' })
    codigo: string

    /**
    * título
    */
    @IsString({ message: '$property| Título: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Título: 250 caracteres' })
    titulo: string

    /**
    * Polaridade
    * @example Neutra
    * */
    @ApiProperty({ enum: Polaridade, enumName: 'Polaridade' })
    @IsEnum(Polaridade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Polaridade).join(', ')
    })
    polaridade: Polaridade

    /**
    * @example Mensal
    * */
    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', ')
    })
    periodicidade: Periodicidade

    /**
    * regionalizavel
    */
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    regionalizavel: boolean

    /**
    * nivel_regionalizacao
    */
    @IsOptional()
    @IsPositive({ message: '$property| nivel_regionalizacao precisa ser um número ou null' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    nivel_regionalizacao?: number | null

    /**
    * inicio_medicao
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_medicao: Date

    /**
    * fim_medicao
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    fim_medicao: Date


    /**
    * meta_id
    */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    @IsOptional()
    meta_id?: number

    /**
    * iniciativa_id
    */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    @IsOptional()
    iniciativa_id?: number

    /**
    * atividade_id
    */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    @IsOptional()
    atividade_id?: number

    @IsOptional()
    @IsString({ message: '$property| Precisa ser uma string' })
    contexto?: string | null

    @IsOptional()
    @IsString({ message: '$property| Precisa ser uma string' })
    observacao?: string | null
}
