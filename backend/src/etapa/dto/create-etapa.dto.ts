import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';
import { PartialType, PickType } from '@nestjs/swagger';
import { CreateVariavelBaseDto } from '../../variavel/dto/create-variavel.dto';
import { CreatePSEquipePontoFocalDto } from '../../pdm/dto/create-pdm.dto';

export class UpsertEtapaVariavelDto extends PartialType(PickType(CreateVariavelBaseDto, ['titulo'])) {
    @IsString()
    @MaxLength(60)
    codigo: string;
}

export class CreateEtapaDto {
    /**
     * lista dos responsáveis pelo preenchimento. Pelo menos uma pessoa
     * Apenas no PDM, não é obrigatório no PS
     * @example "[4, 5, 6]"
     */
    @IsOptional()
    @IsArray({ message: 'Responsáveis precisa ser um array' })
    @ArrayMaxSize(100, { message: 'Responsáveis precisa ter no máximo 100 items' })
    @ArrayMinSize(0, { message: 'Responsáveis precisa ter no mínimo 1 item' })
    @IsInt({ each: true, message: 'Responsáveis: Cada item precisa ser um número inteiro' })
    responsaveis: number[];

    /**
     * Ponto Focal Plano Setorial
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipePontoFocalDto)
    @ValidateNested()
    ps_ponto_focal?: CreatePSEquipePontoFocalDto;

    /**
     * etapa_pai_id
     */
    @IsInt({ message: 'Etapa pai precisa ser um número ou null' })
    @Type(() => Number)
    @IsOptional()
    etapa_pai_id?: number;

    /**
     * regiao_id
     */
    @IsInt({ message: 'região precisa ser um número ou null' })
    @Type(() => Number)
    @IsOptional()
    regiao_id?: number;

    /**
     * descricao
     */
    @IsString({ message: 'contexto: Precisa ser alfanumérico' })
    @IsOptional()
    descricao?: string;

    /**
     * status
     */
    @IsString({ message: 'status: Precisa ser alfanumérico' })
    @MinLength(1, { message: 'status: pelo menos um caractere' })
    @IsOptional()
    @MaxLength(250, { message: 'status: 250 caracteres' })
    status?: string;

    @IsNumber()
    @IsInt({ message: 'ordem precisa ser um número ou null' })
    @IsOptional()
    ordem?: number;

    /**
     * titulo
     */
    @IsString({ message: 'titulo: Precisa ser alfanumérico' })
    @MinLength(1, { message: 'titulo: pelo menos um caractere' })
    @MaxLength(250, { message: 'titulo: 250 caracteres' })
    titulo: string;

    /**
     * inicio_previsto
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    inicio_previsto?: Date | null;

    /**
     * termino_previsto
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    termino_previsto?: Date | null;

    /**
     * inicio_real
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    inicio_real?: Date | null;

    /**
     * termino_real
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    termino_real?: Date | null;

    /**
     * prazo_inicio
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    prazo_inicio?: Date | null;

    /**
     * prazo_termino
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    prazo_termino?: Date | null;

    @IsOptional()
    @IsInt({ message: 'Peso precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    peso?: number;

    @IsOptional()
    @IsNumber()
    @ValidateIf((object, value) => value !== null)
    @Min(0, { message: 'Percentual de execução precisa ser positivo ou zero' })
    @Max(100, { message: 'Percentual de execução máximo é 100' })
    percentual_execucao?: number;

    @IsOptional()
    @IsBoolean()
    endereco_obrigatorio?: boolean;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao?: string[];

    @IsOptional()
    @Type(() => UpsertEtapaVariavelDto)
    @ValidateIf((object, value) => value !== null)
    @ValidateNested()
    variavel?: UpsertEtapaVariavelDto | null;
}
