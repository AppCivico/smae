import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { FiltroMetasIniAtividadeDto } from '../../relatorios/dto/filtros.dto';

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
    @ApiProperty({ enum: PeriodoRelatorioPrevisaoCustoDto, enumName: 'PeriodoRelatorioPrevisaoCustoDto' })
    @IsEnum(PeriodoRelatorioPrevisaoCustoDto, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' +
            Object.values(PeriodoRelatorioPrevisaoCustoDto).join(', '),
    })
    periodo_ano: PeriodoRelatorioPrevisaoCustoDto;

    /**
     * @example "2022"
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    ano?: number;
}

// todos os filtros vão aqui
export class SuperCreateRelPrevisaoCustoDto extends IntersectionType(FiltroMetasIniAtividadeDto, PrevisaoCustoParams) {
    /**
     * @example "21"
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    projeto_id?: number;

    /**
     * @example "21"
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    portfolio_id?: number;
}

// aqui remove os filtros do projeto
export class CreateRelPrevisaoCustoDto extends OmitType(SuperCreateRelPrevisaoCustoDto, [
    'projeto_id',
    'portfolio_id',
] as const) {}
