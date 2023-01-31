import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, isInt, IsNumber, isNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { CreateProjetoDto } from './create-projeto.dto';

export class PPfonteRecursoDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    /**
     * código da fonte de recurso no SOF, no ano escolhido
     */
    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2)
    fonte_recurso_cod_sof: string;

    @IsInt()
    @Max(3000)
    @Min(2003)
    fonte_recurso_ano: number;

    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| até duas casas decimais' })
    valor_percentual?: number | null;

    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| até duas casas decimais' })
    valor_nominal?: number | null;
}

export class PPpremissaDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2048)
    premissa: string;
}

export class PPrestricaoDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2048)
    restricao: string;
}


export class UpdateProjetoDto extends OmitType(PartialType(CreateProjetoDto), ['portfolio_id', 'orgao_gestor_id']) {

    // FONTE-RECURSO 1..N


    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPpremissaDto)
    premissas?: PPpremissaDto[];

    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPrestricaoDto)
    restricoes?: PPrestricaoDto[];


    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPfonteRecursoDto)
    fonte_recursos?: PPfonteRecursoDto[];

}
