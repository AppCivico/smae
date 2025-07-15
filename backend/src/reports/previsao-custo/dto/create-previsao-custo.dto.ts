import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { Transform, Expose } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { FiltroMetasIniAtividadeDto } from '../../relatorios/dto/filtros.dto';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export const PeriodoRelatorioPrevisaoCustoDto = {
    Corrente: 'Corrente',
    Anterior: 'Anterior',
};

export type PeriodoRelatorioPrevisaoCustoDto =
    (typeof PeriodoRelatorioPrevisaoCustoDto)[keyof typeof PeriodoRelatorioPrevisaoCustoDto];

export class PrevisaoCustoParams {
    /**
     * @example "Corrente"
     */
    @IsOptional()
    @ApiProperty({
        enum: PeriodoRelatorioPrevisaoCustoDto,
        enumName: 'PeriodoRelatorioPrevisaoCustoDto',
        deprecated: true,
    })
    @IsEnum(PeriodoRelatorioPrevisaoCustoDto, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' +
            Object.values(PeriodoRelatorioPrevisaoCustoDto).join(', '),
    })
    @Expose()
    periodo_ano?: PeriodoRelatorioPrevisaoCustoDto;

    /**
     * @example "2022"
     */
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @IsOptional()
    @Expose()
    ano?: number;
}

// todos os filtros vão aqui
export class SuperCreateRelPrevisaoCustoDto extends IntersectionType(FiltroMetasIniAtividadeDto, PrevisaoCustoParams) {
    /**
     * @example "21"
     */
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @IsOptional()
    @Expose()
    projeto_id?: number;

    /**
     * @example "21"
     */
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @IsOptional()
    @Expose()
    portfolio_id?: number;
}

// aqui remove os filtros do projeto
export class CreateRelPrevisaoCustoDto extends OmitType(SuperCreateRelPrevisaoCustoDto, [
    'projeto_id',
    'portfolio_id',
] as const) {}
