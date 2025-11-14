import { ApiProperty } from '@nestjs/swagger';
import { Periodicidade, Periodo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';

export class CreateParamsPainelConteudoDto {
    @IsArray({ message: 'precisa ser uma array, campo obrigatório' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    metas: number[];
}

export class CreatePainelConteudoDto {
    @IsInt({ message: 'painel precisa ser um número' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    painel_id: number;

    @IsInt({ message: 'meta precisa ser um número' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    meta_id: number;

    @IsInt({ message: 'indicador precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    indicador_id?: number;

    @IsInt({ message: 'tema precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    ordem?: number;

    @IsBoolean()
    mostrar_acumulado: boolean;

    @IsBoolean()
    mostrar_indicador: boolean;

    @IsBoolean()
    mostrar_planejado: boolean;

    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', '),
    })
    periodicidade: Periodicidade;

    @ApiProperty({ enum: Periodo, enumName: 'Periodo' })
    @IsEnum(Periodo, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(Periodo).join(', '),
    })
    periodo?: Periodo;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_fim?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_inicio?: Date;

    @IsOptional()
    @IsNumber()
    periodo_valor?: number;

    @IsOptional()
    @IsBoolean()
    mostrar_acumulado_periodo?: boolean;
}
