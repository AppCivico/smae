import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

export class FilterMfMetaDto {
    /**
   * Incluir metas pelas etadas do cronograma
   * @example "true"
    */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    via_cronograma: boolean;

    /**
   * Incluir metas pelas variaveis dos indicadores
   * @example "true"
    */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    via_variaveis: boolean;
}


export class MfMetaAgrupadaDto {
    grupo: string
    id: number
    titulo: string
    codigo: string
}

export class ListMfMetasAgrupadasDto {
    linhas: MfMetaAgrupadaDto[]
    @ApiProperty({ enum: ['Status', 'Fase'] })
    agrupador: string
}
