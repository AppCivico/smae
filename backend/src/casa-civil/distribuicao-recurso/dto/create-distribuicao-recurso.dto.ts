import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class CreateDistribuicaoRegistroSEIDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    nome?: string;

    @IsString()
    @MaxLength(40)
    processo_sei: string;
}

export class CreateDistribuicaoRecursoDto {
    @IsNumber()
    transferencia_id: number;

    @IsNumber()
    orgao_gestor_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    objeto: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    nome?: string;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 2 dígitos após, enviado em formato string',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 2 dígitos após, enviado em formato string',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor_total: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 2 dígitos após, enviado em formato string',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor_contrapartida: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    custeio: number;

    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    pct_custeio?: number;

    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    pct_investimento?: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    investimento: number;

    @IsOptional()
    @IsBoolean()
    empenho?: boolean;

    @IsOptional()
    /**
     * data de empenho
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_empenho?: Date;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    programa_orcamentario_estadual?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    programa_orcamentario_municipal?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    dotacao?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    proposta?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    contrato?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    convenio?: string;

    @IsOptional()
    /**
     * assinatura_termo_aceite
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    assinatura_termo_aceite?: Date;

    @IsOptional()
    /**
     * assinatura_municipio
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    assinatura_municipio?: Date;

    @IsOptional()
    /**
     * assinatura_estado
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    assinatura_estado?: Date;

    @IsOptional()
    /**
     * vigencia
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    vigencia?: Date;

    @IsOptional()
    /**
     * conclusao_suspensiva
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    conclusao_suspensiva?: Date;

    @IsOptional()
    @IsArray()
    @IsArray({ message: 'precisa ser uma array.' })
    @ValidateNested({ each: true })
    @Type(() => CreateDistribuicaoRegistroSEIDto)
    registros_sei?: CreateDistribuicaoRegistroSEIDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreateDistribuicaoParlamentarDto)
    parlamentares?: CreateDistribuicaoParlamentarDto[];
}

export class CreateDistribuicaoParlamentarDto {
    @IsNumber()
    parlamentar_id: number;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    objeto?: string;

    @IsOptional()
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 2 dígitos após, enviado em formato string',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor?: number;
}
