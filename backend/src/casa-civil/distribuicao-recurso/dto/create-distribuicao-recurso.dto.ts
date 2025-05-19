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
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_HTML } from 'src/common/consts';

export class CreateDistribuicaoRegistroSEIDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome?: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Processo SEI' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    processo_sei: string;
}

export class CreateDistribuicaoRecursoDto {
    @IsNumber()
    transferencia_id: number;

    @IsNumber()
    orgao_gestor_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_HTML, { message: `O campo 'Objeto' deve ter no máximo ${MAX_LENGTH_HTML} caracteres` })
    objeto: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 2 dígitos após, enviado em formato string',
        }
    )
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    valor_empenho?: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 2 dígitos após, enviado em formato string',
        }
    )
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    valor_liquidado?: number;

    @IsOptional()
    @IsString()
    rubrica_de_receita?: string;

    @IsOptional()
    @IsString()
    finalidade?: string;

    @IsOptional()
    @IsString()
    gestor_contrato?: string;

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
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Programa Orçamentário Estadual' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    programa_orcamentario_estadual?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Programa Orçamentário Municipal' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    programa_orcamentario_municipal?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Dotação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    dotacao?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Proposta' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    proposta?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Contrato' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    contrato?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Convênio' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
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

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Banco aceite' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    banco_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Agência aceite' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    agencia_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Conta aceite' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    conta_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Conta fim' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    conta_fim?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Agência fim' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    agencia_fim?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Banco fim' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    banco_fim?: string;
}

export class CreateDistribuicaoParlamentarDto {
    @IsNumber()
    parlamentar_id: number;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Objeto' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
