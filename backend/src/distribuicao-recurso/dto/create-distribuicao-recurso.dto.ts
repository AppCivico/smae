import { Transform, Type } from 'class-transformer';
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
import { DateTransform } from '../../auth/transforms/date.transform';

export class CreateDistribuicaoRecursoDto {
    @IsNumber()
    transferencia_id: number;

    @IsNumber()
    orgao_gestor_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(1024)
    objeto: string;

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

    @IsBoolean()
    empenho: boolean;

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
}

class CreateDistribuicaoRegistroSEIDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString()
    @MaxLength(40)
    processo_sei: string;
}
