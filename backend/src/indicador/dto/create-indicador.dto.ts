import { ApiProperty } from "@nestjs/swagger";
import { Periodicidade, Polaridade } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, isPositive, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateIndicadorDto {

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
    * agregador_id
    */
    @IsPositive({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    agregador_id: number


    /**
    * janela_agregador
    */
    @IsOptional()
    @IsPositive({ message: '$property| precisa ser um número ou nulo' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    janela_agregador?: number | null

    /**
    * regionalizavel
    */
    @IsBoolean({ message: '$property| precisa ser um número' })
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
    meta_id: number

}
