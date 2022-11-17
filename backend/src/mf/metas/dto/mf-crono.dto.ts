import { Type } from "class-transformer";
import { IsOptional } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class MfEtapaDto {

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
