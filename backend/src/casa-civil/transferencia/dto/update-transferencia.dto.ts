import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean, IsInt,
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
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    dotacao?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    ordenador_despesa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    gestor_contrato?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    banco_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    agencia_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    conta_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    conta_fim?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    agencia_fim?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    banco_fim?: string;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
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
    descricao?: string | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data?: Date | null;
}
