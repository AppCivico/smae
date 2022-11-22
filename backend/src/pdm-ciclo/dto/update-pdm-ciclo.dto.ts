import { Transform } from "class-transformer";
import { IsInt } from "class-validator";

export class UpdatePdmCicloDto {

}

export class FilterPdmCiclo {
    @IsInt()
    @Transform(({ value }: any) => +value)
    pdm_id: number

}