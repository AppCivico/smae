import { ApiHideProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateEtapaDto {
    /**
    * cronograma_id
    */
    @IsPositive({ message: '$property| Cronograma precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @ApiHideProperty()
    cronograma_id: number

    /**
    * etapa_pai_id
    */
    @IsPositive({ message: '$property| Etapa pai precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    etapa_pai_id?: number

    /**
    * regiao_id
    */
    @IsPositive({ message: '$property| região precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    regiao_id?: number

    /**
    * descricao
    */
    @IsString({ message: '$property| contexto: Precisa ser alfanumérico' })
    @IsOptional()
    descricao?: string

    /**
    * status
    */
    @IsString({ message: '$property| status: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| status: pelo menos um caractere' })
    @IsOptional()
    @MaxLength(250, { message: '$property| status: 250 caracteres' })
    status?: string

    @IsNumber()
    @IsPositive({ message: '$property| ordem precisa ser um número ou null' })
    @IsOptional()
    ordem?: number

    /**
    * titulo
    */
    @IsString({ message: '$property| titulo: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| titulo: pelo menos um caractere' })
    @IsOptional()
    @MaxLength(250, { message: '$property| titulo: 250 caracteres' })
    titulo?: string

    /**
    * inicio_previsto
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_previsto?: Date

    /**
    * termino_previsto
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    termino_previsto?: Date

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