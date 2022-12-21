import { ApiProperty } from "@nestjs/swagger";
import { FonteRelatorio } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

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


    @IsOptional()
    @IsString()
    @MaxLength(1000)
    /**
     * token for next page results
    */
    next_page_token?: string;

    /**
    * items per page, default 25
    * @example "25"
    */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: any) => a.value === '' ? undefined : +a.value)
    ipp?: number;
}
