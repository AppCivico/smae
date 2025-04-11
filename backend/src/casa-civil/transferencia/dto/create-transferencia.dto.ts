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
    @MaxLength(250)
    secretaria_concedente?: string;

    @IsString()
    @MinLength(1)
    @MaxLength(1024)
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
    @MaxLength(250)
    emenda?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    demanda?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    programa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    normativa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    observacoes?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    detalhamento?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    nome_programa?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    agencia_aceite?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
    emenda_unitaria?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(250)
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
    @MaxLength(1024)
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
    @MaxLength(2048)
    descricao?: string;
}
