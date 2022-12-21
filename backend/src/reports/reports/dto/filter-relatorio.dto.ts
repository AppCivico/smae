import { ApiProperty } from "@nestjs/swagger";
import { FonteRelatorio } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional } from "class-validator";

export class FilterRelatorioDto {
    /**
    * Filtrar pdm_id ?
    * @example ""
    */
    @IsOptional()
    @IsInt()
    @Transform(({ value }: any) => +value)
    pdm_id?: number;

    /**
    * Filtrar fonte ?
    * @example ""
    */
    @IsOptional()
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', ')
    })
    fonte?: FonteRelatorio;
}
