import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumberString, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { CreateTransferenciaDto } from './create-transferencia.dto';

export class UpdateTransferenciaDto extends PartialType(CreateTransferenciaDto) {}

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
    empenho?: boolean;
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
