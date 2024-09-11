import { ApiProperty } from '@nestjs/swagger';
import { VariavelFase } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';

export class ListVariavelGlobalCicloDto {
    linhas: VariavelGlobalCicloDto[];
}

export class FilterVariavelGlobalCicloDto {
    /**
     * Fase da variável, eg: Preenchimento
     *
     */
    @IsOptional()
    @IsEnum(VariavelFase)
    @ApiProperty({ enum: VariavelFase })
    fase?: VariavelFase;

    /**
     * caso seja true, irá simular o ponto focal se tiver permissão `SMAE.superadmin` ou `CadastroVariavelGlobal.administrador`
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    simular_ponto_focal?: boolean;

    /**
     * Apenas usado se `simular_ponto_focal` for true
     */
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    simular_usuario?: number;
}

export class VariavelGlobalCicloDto {
    /***
     * qual o ID do variavel está associada
     * @example "1"
     */
    id: number;
    titulo: string;
    fase: VariavelFase;

    @ApiProperty({ type: 'string', format: 'date' })
    proximo_periodo_abertura: string;
    @ApiProperty({ type: 'string', format: 'date' })
    ultimo_periodo_valido: string;
}

export class VariavelGlobalAnaliseItemDto {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    variavel_id?: number;

    @IsNumberString(
        {},
        {
            message:
                'Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover',
        }
    )
    @ValidateIf((object, value) => value !== '')
    @Type(() => String)
    valor_realizado: string;
}

export class BatchAnaliseQualitativaDto {
    @IsInt()
    @Transform(NumberTransform)
    variavel_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    analise_qualitativa?: string;

    @IsOnlyDate()
    @Transform(DateTransform)
    data_referencia: Date;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    uploads?: string[];

    @IsArray()
    @Type(() => VariavelGlobalAnaliseItemDto)
    @ValidateNested({ each: true })
    valores: VariavelGlobalAnaliseItemDto[];
}
