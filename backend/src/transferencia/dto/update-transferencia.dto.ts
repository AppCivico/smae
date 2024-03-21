import { PartialType } from '@nestjs/swagger';
import { CreateTransferenciaDto } from './create-transferencia.dto';
import { IsBoolean, IsNumberString, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';

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

    @IsBoolean()
    empenho: boolean;
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
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data?: Date | null;
}
