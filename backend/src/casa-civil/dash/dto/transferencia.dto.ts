import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { NumberArrayTransform } from '../../../auth/transforms/number-array.transform';
import { BadRequestException } from '@nestjs/common';
import { StringArrayTransform } from '../../../auth/transforms/string-array.transform';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';

export class MfDashTransferenciasDto {
    @ApiProperty({ description: 'ID da transferência' })
    transferencia_id: number;
    identificador: string;
    atividade: string;
    data: Date | null;
    data_origem: string;
    orgaos: number[];
    esfera: string;
    objeto: string;
    partido_id: number | null;
}

export class ListMfDashTransferenciasDto {
    linhas: MfDashTransferenciasDto[];
}

const TransformTransferenciaTipoEsfera = (a: TransformFnParams): TransferenciaTipoEsfera[] | undefined => {
    if (!a.value) return undefined;

    if (!Array.isArray(a.value)) a.value = a.value.split(',');

    const validatedArray = a.value.map((item: any) => {
        const parsedValue = ValidateTransferenciaTipoEsfera(item);
        return parsedValue;
    });

    return validatedArray;
};

export class FilterDashTransferenciasDto {
    @IsOptional()
    @IsArray()
    @ApiProperty({
        isArray: true,
        enum: TransferenciaTipoEsfera,
        enumName: 'TransferenciaTipoEsfera',
        description: 'Esfera da transferência',
    })
    @Transform(TransformTransferenciaTipoEsfera)
    esfera?: TransferenciaTipoEsfera[];

    @ApiProperty({ description: 'Contém qualquer um dos partidos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    partido_ids?: number[];

    @IsOptional()
    @IsArray()
    @MaxLength(1000, { each: true })
    @IsString({ each: true })
    @ApiProperty({ description: 'Atividade do cronograma' })
    @Transform(StringArrayTransform)
    atividade?: string[];

    @ApiProperty({ description: 'Contém qualquer um dos órgãos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    orgaos_ids?: number[];

    @IsOptional()
    @IsString()
    palavra_chave?: string;
}

function ValidateTransferenciaTipoEsfera(item: any) {
    const parsedValue = TransferenciaTipoEsfera[item as TransferenciaTipoEsfera];
    if (parsedValue === undefined) {
        throw new BadRequestException(`Valor '${item}' não é válido para TransferenciaTipoEsfera`);
    }
    return parsedValue;
}

export class FilterDashTransferenciasAnaliseDto extends PartialType(
    OmitType(FilterDashTransferenciasDto, ['esfera', 'atividade', 'palavra_chave'])
) {
    @ApiProperty({ description: 'Contém qualquer um dos parlamentares', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    parlamentar_ids?: number[];

    @ApiProperty({ description: 'Contém qualquer um dos anos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    anos?: number[];

    @ApiProperty({ description: 'Contém qualquer uma das etapas', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    etapa_ids?: number[];
}

export class DashAnaliseTranferenciasDto {
    valor_total: number;

    numero_por_esfera: DashNumeroTransferenciasPorEsferaDto;
    numero_por_status: DashNumeroTransferenciasPorStatusDto;
    numero_por_partido: DashNumeroTransferenciasPorPartidoDto[];
    valor_por_partido: DashValorTransferenciasPorPartidoDto[];
    valor_por_orgao: DashValorTransferenciasPorOrgaoDto[];
    valor_por_parlamentar: DashValorTransferenciasPorParlamentarDto[];
}

export class DashNumeroTransferenciasPorEsferaDto {
    federal: number;
    estadual: number;
}

export class DashNumeroTransferenciasPorStatusDto {
    prejudicadas: number;
    concluidas: number;
    em_andamento: number;
    disponibilizadas: number;
}

export class DashNumeroTransferenciasPorPartidoDto {
    partido: IdSigla;
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    esfera: TransferenciaTipoEsfera;
    numero: number;
}

export class DashValorTransferenciasPorPartidoDto {
    partido: IdSigla;
    valor: number;
}

export class DashValorTransferenciasPorOrgaoDto {
    orgao: IdSiglaDescricao;
    valor: number;
}

export class DashValorTransferenciasPorParlamentarDto {
    parlamentar: DashParlamentar;
    valor: number;
}

export class DashParlamentar {
    id: number;
    nome_popular: string;
    foto: string | null;
}

export class DashAnaliseTranferenciasChartsDto {
    valor_total: number;

    numero_por_esfera: DashTransferenciaBasicChartDto;
    numero_por_status: DashTransferenciaBasicChartDto;
    numero_por_partido: DashTransferenciaBasicChartDto;
    valor_por_partido: DashTransferenciaBasicChartDto;
    valor_por_orgao: DashTransferenciaBasicChartDto;
    valor_por_parlamentar: DashValorTransferenciasPorParlamentarDto[];
}

export class ChartDataDto {
    type: string;
    name?: string;
    nameLocation?: string;
    data?: string[] | ChartDataWithColor[];
    stack?: string;
    encode?: {
        x: string;
        y: string;
    };
    label?: {
        show: boolean;
    };
    color?: string;
    barWidth?: string;
}

export class ChartDataTitleDto {
    id: string;
    text: string;
}

export class ChartDataWithColor {
    value: string;
    itemStyle: {
        color: string;
    };
}
export class ChartDatasetDto {
    source: string[];
}
export class DashTransferenciaBasicChartDto {
    title?: ChartDataTitleDto;
    tooltip: DashChartTooltip;
    xAxis: ChartDataDto;
    yAxis: ChartDataDto;
    series: ChartDataDto[];
}

export class DashChartTooltip {
    trigger: string;
    axisPointer: {
        type: string;
    };
}
