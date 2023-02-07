import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CategoriaProcessoSei } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, isInt, IsNumber, isNumber, IsOptional, isString, IsString, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
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

export class PSeiDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @ApiProperty({ enum: CategoriaProcessoSei, enumName: 'CategoriaProcessoSei' })
    @IsEnum(CategoriaProcessoSei, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(CategoriaProcessoSei).join(', '),
    })
    categoria: CategoriaProcessoSei
    
    @IsString()
    processo_sei: string    
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

    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PSeiDto)
    sei?: PSeiDto[];

    @IsOptional()
    @IsString()
    codigo?: string

    @IsOptional()
    @IsString()
    descricao?: string

    @IsOptional()
    @IsString()
    objeto?: string

    @IsOptional()
    @IsString()
    objetivo?: string

    @IsOptional()
    @IsString()
    publico_alvo?: string


    // esses campos serão updated apenas via sistema (pelas tarefas)
    //    @IsOptional()
    //    @IsOnlyDate()
    //    @Type(() => Date)
    //    @ValidateIf((object, value) => value !== null)
    //    realizado_inicio?: Date
    //
    //    @IsOptional()
    //    @IsOnlyDate()
    //    @Type(() => Date)
    //    @ValidateIf((object, value) => value !== null)
    //    realizado_termino?: Date
    //
    //    @IsOptional()
    //    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custo até duas casas decimais' })
    //    @Min(0, { message: '$property| Custo precisa ser positivo' })
    //    @Transform((a: any) => (a.value === null ? null : +a.value))
    //    @ValidateIf((object, value) => value !== null)
    //    realizado_custo?: number

    @IsOptional()
    @IsString()
    nao_escopo?: string

    @IsOptional()
    @IsBoolean()
    arquivado?: boolean
}
