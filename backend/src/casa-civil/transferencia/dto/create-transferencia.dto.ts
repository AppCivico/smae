import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo, TransferenciaInterface, TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
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
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class CreateTransferenciaDto {
    @IsNumber()
    tipo_id: number;

    @IsNumber()
    orgao_concedente_id: number;

    @IsString()
    @IsOptional()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Secretária concedente" deve ter no máximo 255 caracteres' })
    secretaria_concedente?: string;

    @IsString()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Objeto" deve ter no máximo 255 caracteres' })
    objeto: string;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaInterface, enumName: 'TransferenciaInterface' })
    @IsEnum(TransferenciaInterface, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaInterface).join(', '),
    })
    interface?: TransferenciaInterface;

    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera: TransferenciaTipoEsfera;

    @IsOptional()
    @IsBoolean()
    clausula_suspensiva?: boolean;

    /**
     * clausula_suspensiva_vencimento
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    clausula_suspensiva_vencimento?: Date | null;

    /**
     * ano: ano para pesquisa
     * @example "2022"
     */
    @IsInt({ message: '$property| ano precisa ser positivo' })
    @Min(1889)
    @Max(2050)
    @Type(() => Number)
    ano: number;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Emenda" deve ter no máximo 255 caracteres' })
    emenda?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Demanda" deve ter no máximo 255 caracteres' })
    demanda?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Programa" deve ter no máximo 255 caracteres' })
    programa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Normativa" deve ter no máximo 255 caracteres' })
    normativa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, { message: 'O campo "Observações" deve ter no máximo 255 caracteres' })
    observacoes?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Detalhamento" deve ter no máximo 255 caracteres'})
    detalhamento?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Nome Programa" deve ter no máximo 255 caracteres'})
    nome_programa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Agência aceite" deve ter no máximo 255 caracteres'})
    agencia_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Emenda unitária" deve ter no máximo 255 caracteres'})
    emenda_unitaria?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Número identificação" deve ter no máximo 255 caracteres'})
    numero_identificacao?: string;

    @IsOptional()
    @IsInt()
    workflow_orgao_responsavel_id?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreateTransferenciaParlamentarDto)
    parlamentares?: CreateTransferenciaParlamentarDto[];

    @IsOptional()
    @IsInt()
    classificacao_id?: number;
}

export class CreateTransferenciaParlamentarDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNumber()
    parlamentar_id: number;

    @IsNumber()
    partido_id: number;

    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarCargo).join(', '),
    })
    cargo: ParlamentarCargo;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(255, {message: 'O campo "Objeto" deve ter no máximo 255 caracteres'})
    objeto: string;
}

export class CreateTransferenciaAnexoDto {
    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token do documento' })
    upload_token: string;

    @IsString()
    @IsOptional()
    diretorio_caminho?: string;

    /**
     * data ou null
     * @example "2020-01-01"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao?: string;
}
