import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { CreateProjetoDto, CreateProjetoSeiDto } from './create-projeto.dto';

export class PPpremissaDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(255, { message: 'O campo "Premissa" deve ter no máximo 255 caracteres' })
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
    @MaxLength(255, { message: 'O campo "Restrição" deve ter no máximo 255 caracteres' })
    restricao: string;
}

export class UpdateProjetoRegistroSeiDto extends PartialType(CreateProjetoSeiDto) {}

// esses campos serão updated apenas via sistema (pelas tarefas)
//    @IsOptional()
//    @IsOnlyDate()
//    @Transform(DateTransform)
//    @ValidateIf((object, value) => value !== null)
//    realizado_inicio?: Date
//
//    @IsOptional()
//    @IsOnlyDate()
//    @Transform(DateTransform)
//    @ValidateIf((object, value) => value !== null)
//    realizado_termino?: Date
//
//    @IsOptional()
//    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custo até duas casas decimais' })
//    @Min(0, { message: '$property| Custo precisa ser positivo' })
//    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
//    @ValidateIf((object, value) => value !== null)
//    realizado_custo?: number

export class UpdateProjetoDto extends OmitType(PartialType(CreateProjetoDto), [
    'portfolio_id',
    'orgao_gestor_id',
    'orgao_origem_id',
]) {
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
    @ApiProperty({
        deprecated: true,
        description: 'Não é mais possível escrever o codigo',
    })
    codigo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Objeto" deve ter no máximo 255 caracteres' })
    objeto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Objetivo" deve ter no máximo 255 caracteres' })
    objetivo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Público Alvo" deve ter no máximo 255 caracteres' })
    publico_alvo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Não Escopo" deve ter no máximo 255 caracteres' })
    nao_escopo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Coordenador" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    coordenador_ue?: string | null;

    /**
     * texto que representa a versão
     * @example "..."
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Versão" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    versao?: string | null;

    /**
     * data_aprovacao
     * @example "2022-01-20"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_aprovacao?: Date | null;

    /**
     * data_revisao
     * @example "2022-01-20"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_revisao?: Date | null;

    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| Precisa ser uma lista de inteiros', each: true })
    @Max(1000, { each: true })
    grupo_portfolio?: number[];

    /**
     * “Equipe” pessoas que terão permissão para editar o projeto (mesmos privilégios do gerente de projeto)
     *
     * Ao salvar, o banco calcula automaticamente o órgão da pessoa, se mudar de órgão, o privilégio é perdido.
     */
    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| Precisa ser uma lista de inteiros', each: true })
    @Max(1000, { each: true })
    equipe?: number[];
}

export class UpdateProjetoDocumentDto {
    /**
     * Token para encontrar documento
     */
    @IsString({ message: '$property| upload_token do documento' })
    upload_token: string;

    @IsString()
    @IsOptional()
    diretorio_caminho?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(2048, { message: 'Descrição precisa ter no máximo 2048 caracteres' })
    descricao?: string | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data?: Date | null;
}

export class CloneProjetoTarefasDto {
    @IsInt()
    projeto_fonte_id: number;
}

export class TransferProjetoPortfolioDto {
    @IsInt()
    portfolio_id: number;
}

export class RevisarObrasDto {
    @IsArray({ message: '$property| precisa ser um array' })
    @ValidateNested({ each: true })
    @Type(() => ObraRevisaoDto)
    obras: ObraRevisaoDto[];
}

export class ObraRevisaoDto {
    @IsInt()
    projeto_id: number;

    @IsBoolean()
    revisado: boolean;
}
