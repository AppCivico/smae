import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { NumberArrayTransformOrUndef } from '../../../auth/transforms/number-array.transform';
import { BadRequestException } from '@nestjs/common';
import { StringArrayTransform } from '../../../auth/transforms/string-array.transform';
import { IdSigla, IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { IsDateYMD } from '../../../auth/decorators/date.decorator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { PartidoDto } from 'src/partido/entities/partido.entity';
import { ParlamnetarIdNomes } from 'src/parlamentar/entities/parlamentar.entity';
import { NumberTransform } from 'src/auth/transforms/number.transform';

export class MfDashTransferenciasDto {
    @ApiProperty({ description: 'ID da transferência' })
    transferencia_id: number;
    identificador: string;
    atividade: string;
    @IsDateYMD({ nullable: true })
    data: string | null;
    data_origem: string;
    orgaos: number[];
    esfera: string;
    objeto: string;
    partido_ids: number[] | null;
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
    @Transform(NumberArrayTransformOrUndef)
    partido_ids?: number[];

    @IsOptional()
    @IsArray()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Atividade' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    @IsString({ each: true })
    @ApiProperty({ description: 'Atividade do cronograma' })
    @Transform(StringArrayTransform)
    atividade?: string[];

    @ApiProperty({ description: 'Contém qualquer um dos órgãos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    orgaos_ids?: number[];

    @IsOptional()
    @IsString()
    palavra_chave?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    prazo?: number;
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
    @Transform(NumberArrayTransformOrUndef)
    parlamentar_ids?: number[];

    @ApiProperty({ description: 'Contém qualquer um dos anos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    anos?: number[];

    @ApiProperty({ description: 'Contém qualquer uma das etapas', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    etapa_ids?: number[];
}

export class FilterDashTransferenciasPainelEstrategicoDto extends PartialType(FilterDashTransferenciasAnaliseDto) {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    ipp?: number = 25;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    pagina?: number = 1;

    @IsOptional()
    @IsString()
    token_paginacao?: string;
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
    parlamentar: DashParlamentarDto;
    valor: number;
}

export class DashParlamentarDto {
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

export class DashTransferenciasPainelEstrategicoDto {
    id: number;
    identificador: string;
    esfera: TransferenciaTipoEsfera;
    tipo: IdNomeDto;
    partido: PartidoDto[];
    parlamentar: ParlamnetarIdNomes[];
    orgao_gestor: IdSiglaDescricao;
    objeto: string;
    repasse: number;
    etapa_id: number | null;
}

export class ChartDataDto {
    type: string;
    name?: string;
    nameLocation?: string;
    data?: string[] | ChartDataWithConfigDto[];
    stack?: string;
    encode?: ChartEncodeDto;
    label?: ChartLabelDto;
    color?: string;
    barWidth?: string;
    axisLabel?: {
        overflow: string;
        width: number;
    };
}

export class ChartLegendDto {
    data: string[];
    layout?: string;
    align?: string;
    verticalAlign?: string;
    left: number;
    orient: string;
    top: string;
    textStyle?: {
        overflow: string;
        width: number;
    };
}

export class ChartEncodeDto {
    x: string;
    y: string;
}

export class ChartLabelDto {
    show: boolean;
}

export class ChartDataTitleDto {
    id: string;
    text: string;
}

export class ChartDataWithConfigDto {
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
    legend?: ChartLegendDto;
    tooltip: DashChartTooltipDto;
    xAxis: ChartDataDto;
    yAxis: ChartDataDto;
    series: ChartDataDto[];
    top?: string;
    grid?: {
        left: string;
    };
}

export class DashChartTooltipDto {
    trigger: string;
    axisPointer: {
        type: string;
    };
}
