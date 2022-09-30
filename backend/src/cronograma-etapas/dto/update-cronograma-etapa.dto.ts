import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsNumber, IsOptional, IsPositive, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class UpdateCronogramaEtapaDto {
    /**
    * inativo
    */
    @IsOptional()
    @IsBoolean()
    inativo?: boolean

    /**
    * ordem
    */
    @IsPositive({ message: '$property| ordem precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    ordem?: number

}

export class RequiredFindParamsDto {

    @IsNumber()
    cronograma_id: number

    @IsNumber()
    etapa_id: number
}