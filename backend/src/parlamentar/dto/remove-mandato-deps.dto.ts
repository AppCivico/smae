import { IsNumber } from "class-validator";

export class RemoveMandatoDepsDto {
    @IsNumber()
    mandato_id: number
}

