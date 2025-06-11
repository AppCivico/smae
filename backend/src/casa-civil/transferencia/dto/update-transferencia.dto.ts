import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
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
import { CreateTransferenciaDto, CreateTransferenciaParlamentarDto } from './create-transferencia.dto';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class UpdateTransferenciaDto extends PartialType(OmitType(CreateTransferenciaDto, [])) {}

export class CompletarTransferenciaDto {
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor_total: number;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
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
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    pct_investimento?: number;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Dotação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    dotacao?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Ordenador despesa' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    ordenador_despesa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Gestor contrato' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    gestor_contrato?: string;

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
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Banco fim' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    banco_fim?: string;

    @IsOptional()
    @IsBoolean()
    empenho?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @ValidateIf((object, value) => value !== null)
    @Type(() => UpdateTransferenciaParlamentarDto)
    parlamentares?: UpdateTransferenciaParlamentarDto[];

    @IsOptional()
    @IsInt()
    classificacao_id?: number;
}
export class UpdateTransferenciaParlamentarDto extends PartialType(
    OmitType(CreateTransferenciaParlamentarDto, ['cargo', 'partido_id'])
) {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsOptional()
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor?: number;
}

export class UpdateTransferenciaAnexoDto {
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
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data?: Date | null;
}
